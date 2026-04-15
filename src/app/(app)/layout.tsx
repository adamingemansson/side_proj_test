import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/authOptions";
import { ensureUserSetup } from "@/lib/setup";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Proxy handles the redirect, but this is a belt-and-suspenders check
  if (!session) {
    redirect("/login");
  }

  // Ensure Drive folder exists for this user (skip for demo — no Drive access)
  if (session.user?.id !== "demo") {
    await ensureUserSetup(session);
  }

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-neutral-50">
        <Sidebar />
        <div className="flex flex-1 flex-col pl-56">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
