import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "./db";

// ── Silent token refresh ───────────────────────────────────────────────────

async function refreshAccessToken(token: {
  refreshToken?: string;
  [key: string]: unknown;
}) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken ?? "",
      }),
    });

    const refreshed = await res.json();
    if (!res.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token as string,
      // Google sometimes returns a new refresh token — prefer new one, fall back to existing
      refreshToken: (refreshed.refresh_token as string | undefined) ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in as number),
      error: undefined,
    };
  } catch (err) {
    console.error("[authOptions] Token refresh failed:", err);
    return { ...token, error: "RefreshTokenError" as const };
  }
}

// ── NextAuth configuration ─────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request Drive access + offline access for refresh tokens
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          // Always show consent screen so we always get a refresh token
          prompt: "consent",
        },
      },
    }),
    CredentialsProvider({
      id: "demo",
      name: "Demo",
      credentials: {},
      async authorize() {
        return { id: "demo", name: "Demo User", email: "demo@migradocs.app" };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: { signIn: "/login" },

  callbacks: {
    // ── JWT callback — runs on every session read ──────────────────────────
    async jwt({ token, account, user }) {
      // ① Initial sign-in: account + user are present
      if (account && user) {
        // Demo credentials — no Supabase upsert, no Drive tokens
        if (account.provider === "credentials") {
          return { ...token, userId: "demo" };
        }

        // Upsert user record (ignore if already exists to preserve drive_folder_id)
        await supabase.from("users").upsert(
          {
            id: user.id!,
            email: user.email!,
            display_name: user.name ?? null,
          },
          { onConflict: "id", ignoreDuplicates: true }
        );

        return {
          ...token,
          userId: user.id,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
          expiresAt: account.expires_at!,
        };
      }

      // ② Token not yet expired — return as-is
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // ③ Token expired — attempt silent refresh
      return refreshAccessToken(token);
    },

    // ── Session callback — runs on every useSession / getServerSession call ─
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.accessToken = token.accessToken as string;
      if (token.error) {
        session.error = token.error as "RefreshTokenError";
      }
      return session;
    },
  },
};
