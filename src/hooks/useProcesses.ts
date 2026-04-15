"use client";

import { useState, useEffect } from "react";
import type { ProcessRowWithSteps } from "@/lib/db";
import type { Process, ProcessStatus, ProcessStepStatus } from "@/types";

// Maps a server ProcessRowWithSteps (Supabase) to the legacy Process UI type
// used by OverviewTab, TimelinesTab, and ChecklistsTab.
export function mapProcessRow(row: ProcessRowWithSteps): Process {
  const steps = row.steps ?? [];
  return {
    id: row.id,
    name: row.title,
    country: row.destination_country ?? row.country ?? "",
    currentStageIndex: Math.max(0, steps.findIndex((s) => s.status === "in_progress")),
    status: row.status as ProcessStatus,
    nextAction: row.next_action ?? "",
    nextDeadline: row.next_deadline ?? undefined,
    startedAt: row.created_at,
    documentIds: [],
    notes: row.uncertainty_notes ?? undefined,
    steps: steps.map((s) => ({
      id: s.id,
      order: s.order_index + 1,
      title: s.title,
      description: s.description ?? "",
      status: s.status as ProcessStepStatus,
      deadline: s.target_date ?? undefined,
      notes: s.notes ?? undefined,
      checklistItems: (s.checklist_items ?? []).map((ci) => ({
        id: ci.id,
        label: ci.label,
        completed: ci.completed,
        dueDate: ci.due_date ?? undefined,
      })),
    })),
  };
}

export function useProcesses() {
  const [raw, setRaw] = useState<ProcessRowWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/processes")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => { if (!cancelled) setRaw(data.processes ?? []); })
      .catch(() => { if (!cancelled) setError("Could not load processes."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return {
    raw,
    processes: raw.map(mapProcessRow),
    loading,
    error,
  };
}
