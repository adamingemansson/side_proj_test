"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { ProcessesTab } from "@/components/dashboard/ProcessesTab";
import { DocumentsTab } from "@/components/dashboard/DocumentsTab";
import { TimelinesTab } from "@/components/dashboard/TimelinesTab";
import { ChecklistsTab } from "@/components/dashboard/ChecklistsTab";
import { AnalyseDocumentTab } from "@/components/dashboard/AnalyseDocumentTab";
import { DemoModePanel } from "@/components/dashboard/DemoModePanel";

type DashboardTab =
  | "overview"
  | "processes"
  | "documents"
  | "analyse"
  | "timelines"
  | "checklists"
  | "inbox"
  | "support";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "overview",   label: "Overview"          },
  { id: "processes",  label: "Processes"         },
  { id: "documents",  label: "Documents"         },
  { id: "analyse",    label: "Analyse Document"  },
  { id: "timelines",  label: "Timelines"         },
  { id: "checklists", label: "Checklists"        },
  { id: "inbox",      label: "Inbox"             },
  { id: "support",    label: "Support"           },
];

function DashboardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as DashboardTab) ?? "overview";
  const [demoOpen, setDemoOpen] = useState(false);

  const { data: session } = useSession();
  // Extract first name from the session user's full name
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  const setTab = (tab: DashboardTab) => {
    router.push(`/dashboard?tab=${tab}`);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* ── Top header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">

        {/* Title row + profile actions */}
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-sm font-semibold text-neutral-950">Dashboard</h1>

          <div className="flex items-center gap-1">
            {/* Demo mode toggle */}
            <button
              onClick={() => setDemoOpen(true)}
              title="Open demo walkthrough"
              className="flex items-center gap-1.5 rounded border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:border-navy hover:bg-navy-light hover:text-navy"
            >
              <FlaskConical className="h-3.5 w-3.5" strokeWidth={1.75} />
              Demo
            </button>

            <Link href="/settings">
              <button
                className="rounded p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                title="Settings"
              >
                <Settings className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </Link>
            <button
              onClick={handleLogout}
              className="rounded p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white">
              <User className="h-4 w-4" strokeWidth={1.75} />
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="flex items-center overflow-x-auto px-6" aria-label="Dashboard tabs">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={[
                "shrink-0 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                activeTab === id
                  ? "border-navy text-navy"
                  : "border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300",
              ].join(" ")}
              aria-current={activeTab === id ? "page" : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Tab content ── */}
      <main className="flex-1 p-6">
        {activeTab === "overview" && (
          <OverviewTab
            firstName={firstName}
            onSwitchToProcesses={() => setTab("processes")}
            onSwitchToTimelines={() => setTab("timelines")}
          />
        )}

        {activeTab === "processes" && (
          <ProcessesTab onSwitchToOverview={() => setTab("overview")} />
        )}

        {activeTab === "documents" && (
          <DocumentsTab />
        )}

        {activeTab === "timelines" && (
          <TimelinesTab />
        )}

        {activeTab === "checklists" && (
          <ChecklistsTab />
        )}

        {activeTab === "analyse" && (
          <AnalyseDocumentTab />
        )}

        {activeTab !== "overview" &&
          activeTab !== "processes" &&
          activeTab !== "documents" &&
          activeTab !== "analyse" &&
          activeTab !== "timelines" &&
          activeTab !== "checklists" && (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50">
            <p className="text-sm text-neutral-400 capitalize">
              {activeTab} — content coming soon
            </p>
          </div>
        )}
      </main>

      {/* ── Persistent footer disclaimer ── */}
      <footer className="border-t border-neutral-200 px-6 py-3">
        <p className="text-[11px] text-neutral-400">
          migraDOCS is an information and organisation tool. It does not provide legal advice and does not replace a qualified immigration lawyer.
        </p>
      </footer>

      {/* ── Demo mode panel ── */}
      {demoOpen && <DemoModePanel onClose={() => setDemoOpen(false)} />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardShell />
    </Suspense>
  );
}
