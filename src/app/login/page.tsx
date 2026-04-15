"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LoginCard() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const errorParam = searchParams.get("error");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl });
    // signIn redirects, so setLoading(false) won't run on success
    setLoading(false);
  };

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    await signIn("demo", { callbackUrl: "/dashboard" });
    setDemoLoading(false);
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-8" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h2 className="mb-1 text-sm font-semibold text-neutral-950">Sign in to migraDOCS</h2>
      <p className="mb-6 text-xs text-neutral-500 leading-relaxed">
        Your documents are stored in your own Google Drive. migraDOCS can only see and manage files it created.
      </p>

      {/* Session expired error */}
      {errorParam === "SessionExpired" && (
        <div className="mb-4 flex items-start gap-2 rounded border border-warning/30 bg-warning/5 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.75} />
          <p className="text-xs text-neutral-700">Your session expired. Please sign in again.</p>
        </div>
      )}

      <Button
        onClick={handleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 shadow-sm"
        size="lg"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600" />
        ) : (
          <GoogleIcon />
        )}
        {loading ? "Redirecting to Google…" : "Sign in with Google"}
      </Button>

      <div className="relative my-5 flex items-center">
        <div className="flex-1 border-t border-neutral-200" />
        <span className="px-3 text-[10px] text-neutral-400">or</span>
        <div className="flex-1 border-t border-neutral-200" />
      </div>

      <Button
        onClick={handleDemoSignIn}
        disabled={demoLoading || loading}
        variant="outline"
        className="w-full border-neutral-200 text-neutral-600 hover:bg-neutral-50"
        size="lg"
      >
        {demoLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600" />
        ) : null}
        {demoLoading ? "Loading demo…" : "Try demo (no sign-in needed)"}
      </Button>

      <div className="mt-5 rounded-r border-l-2 border-navy-light bg-navy-light/40 pl-3 pr-3 py-2">
        <p className="text-[11px] leading-relaxed text-neutral-600">
          By signing in, you authorise migraDOCS to create a folder called &quot;migraDOCS&quot; in your Google Drive and store files you upload there. You can revoke access or delete the folder at any time.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span
              className="logo-wordmark"
              style={{ fontSize: "2rem", color: "#0d1b2e", lineHeight: 1 }}
            >
              migraDOCS
            </span>
          </Link>
          <p className="mt-2 text-xs text-neutral-500">Immigration document intelligence</p>
        </div>

        <Suspense>
          <LoginCard />
        </Suspense>

        <p className="mt-6 text-center text-[10px] leading-relaxed text-neutral-400">
          migraDOCS provides document organisation and information only. This is not legal advice.
        </p>
      </div>
    </div>
  );
}
