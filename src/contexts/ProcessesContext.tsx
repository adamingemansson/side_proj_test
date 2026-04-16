"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type { Process } from "@/types";
import { mapProcessRow } from "@/hooks/useProcesses";

interface ProcessesContextValue {
  processes: Process[];
  loading: boolean;
  error: string | null;
  toggleChecklistItem: (processId: string, itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ProcessesContext = createContext<ProcessesContextValue>({
  processes: [],
  loading: true,
  error: null,
  toggleChecklistItem: async () => {},
  refresh: async () => {},
});

export function ProcessesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDemo = session?.user?.id === "demo";

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/processes");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.isDemo) {
        setProcesses(data.processes ?? []);
      } else {
        setProcesses((data.processes ?? []).map(mapProcessRow));
      }
    } catch {
      setError("Could not load processes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleChecklistItem = useCallback(async (processId: string, itemId: string) => {
    // Locate current completed state
    let currentCompleted = false;
    outer: for (const p of processes) {
      if (p.id !== processId) continue;
      for (const s of p.steps) {
        const ci = (s.checklistItems ?? []).find((c) => c.id === itemId);
        if (ci) { currentCompleted = ci.completed; break outer; }
      }
    }
    const newCompleted = !currentCompleted;

    // Optimistic update
    setProcesses((prev) =>
      prev.map((p) =>
        p.id !== processId ? p : {
          ...p,
          steps: p.steps.map((s) => ({
            ...s,
            checklistItems: (s.checklistItems ?? []).map((ci) =>
              ci.id === itemId ? { ...ci, completed: newCompleted } : ci
            ),
          })),
        }
      )
    );

    // Persist for real users
    if (!isDemo) {
      try {
        const res = await fetch(`/api/processes/${processId}/checklist/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: newCompleted }),
        });
        if (!res.ok) throw new Error("API error");
      } catch {
        // Revert on failure
        setProcesses((prev) =>
          prev.map((p) =>
            p.id !== processId ? p : {
              ...p,
              steps: p.steps.map((s) => ({
                ...s,
                checklistItems: (s.checklistItems ?? []).map((ci) =>
                  ci.id === itemId ? { ...ci, completed: currentCompleted } : ci
                ),
              })),
            }
          )
        );
      }
    }
  }, [processes, isDemo]);

  return (
    <ProcessesContext.Provider value={{ processes, loading, error, toggleChecklistItem, refresh }}>
      {children}
    </ProcessesContext.Provider>
  );
}

export function useProcessesContext() {
  return useContext(ProcessesContext);
}
