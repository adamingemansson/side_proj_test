"use client";

import { useState } from "react";
import { CalendarClock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProcessesContext } from "@/contexts/ProcessesContext";
import { formatDateShort } from "@/lib/utils";
import type { Process } from "@/types";

// ── Greeting helpers ───────────────────────────────────────────────────────

function greeting(firstName: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${firstName}.`;
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Circular arc progress ──────────────────────────────────────────────────
//
// Flat-bottom semicircle: the arc runs from the left point (9 o'clock)
// clockwise through the top (12 o'clock) to the right point (3 o'clock).
// In SVG coords (y-down) this path is sweep=0 (counterclockwise in SVG,
// but visually left → up → right, i.e. clockwise as perceived by the user).

const ARC_W = 140;          // SVG width
const ARC_CX = ARC_W / 2;  // circle centre x
const ARC_CY = 70;          // circle centre y  (bottom of the arc)
const ARC_R = 52;           // radius
const ARC_SW = 9;           // stroke width
const ARC_LEN = Math.PI * ARC_R; // half-circumference ≈ 163.4

function CircleProgress({
  process,
  onTap,
}: {
  process: Process;
  onTap: () => void;
}) {
  const allItems = process.steps.flatMap((s) => s.checklistItems ?? []);
  const completedItems = allItems.filter((i) => i.completed).length;
  const progress = allItems.length > 0
    ? Math.round((completedItems / allItems.length) * 100)
    : process.steps.length > 0
    ? Math.round((process.steps.filter((s) => s.status === "completed").length / process.steps.length) * 100)
    : 0;

  // Short hint text: current in-progress step title or nextAction
  const currentStep = process.steps.find((s) => s.status === "in_progress");
  const hint = (currentStep?.title ?? process.nextAction ?? "").slice(0, 38) || null;

  const leftX = ARC_CX - ARC_R;
  const leftY = ARC_CY;
  const rightX = ARC_CX + ARC_R;
  const rightY = ARC_CY;

  // Full background arc (sweep=0 = upper semicircle)
  const bgPath = `M ${leftX} ${leftY} A ${ARC_R} ${ARC_R} 0 0 0 ${rightX} ${rightY}`;

  // Progress arc via stroke-dasharray
  const dashOffset = ARC_LEN * (1 - progress / 100);

  // Short name (first 1–2 words of the process name, strip parenthetical)
  const shortName = process.name
    .replace(/\s*\(.*?\)/g, "")  // strip parentheticals like (Uppehållstillstånd)
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");

  const svgHeight = ARC_CY + ARC_SW / 2 + 4; // just enough for stroke

  return (
    <button
      onClick={onTap}
      className="flex flex-col items-center gap-0 rounded-xl p-2 transition-all hover:bg-neutral-50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
      title={`${process.name} — ${progress}%`}
    >
      <svg
        width={ARC_W}
        height={svgHeight}
        viewBox={`0 0 ${ARC_W} ${svgHeight}`}
        aria-hidden="true"
      >
        {/* Grey background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={ARC_SW}
          strokeLinecap="round"
        />
        {/* Navy progress arc */}
        {progress > 0 && (
          <path
            d={bgPath}
            fill="none"
            stroke="#0d1b2e"
            strokeWidth={ARC_SW}
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={dashOffset}
          />
        )}
        {/* Short process name */}
        <text
          x={ARC_CX}
          y={ARC_CY - ARC_R * 0.38}
          textAnchor="middle"
          fontSize="11"
          fontWeight="500"
          fill="#71717a"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {shortName}
        </text>
        {/* Percentage */}
        <text
          x={ARC_CX}
          y={ARC_CY - ARC_R * 0.05}
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill="#0d1b2e"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {progress}%
        </text>
      </svg>
      {hint && (
        <p className="mt-0.5 max-w-[130px] truncate text-center text-[9px] leading-tight text-neutral-400">
          {hint}
        </p>
      )}
    </button>
  );
}

// ── Process summary card (overlay) ─────────────────────────────────────────

function ProcessSummaryCard({
  process,
  onClose,
  onViewDetails,
}: {
  process: Process;
  onClose: () => void;
  onViewDetails: () => void;
}) {
  const currentStep = process.steps.find((s) => s.status === "in_progress");
  const completedCount = process.steps.filter((s) => s.status === "completed").length;
  const deadlineDays = process.nextDeadline ? daysFromNow(process.nextDeadline) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#0d1b2e]/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Slide-up card */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-xl animate-slide-up rounded-t-2xl border-t border-neutral-200 bg-white px-6 py-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-neutral-950 leading-snug">{process.name}</h3>
          <button
            onClick={onClose}
            className="mt-0.5 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          {/* Current stage */}
          <div className="flex gap-2">
            <p className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 pt-0.5">Current stage</p>
            <p className="text-neutral-700">
              {currentStep
                ? currentStep.title
                : completedCount === process.steps.length
                ? "All steps complete"
                : "Not yet started"}
            </p>
          </div>

          {/* Next action */}
          {process.nextAction && (
            <div className="flex gap-2">
              <p className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 pt-0.5">Next action</p>
              <p className="text-neutral-700">{process.nextAction}</p>
            </div>
          )}

          {/* Next deadline */}
          {process.nextDeadline && deadlineDays !== null && (
            <div className="flex gap-2">
              <p className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 pt-0.5">Next deadline</p>
              <p className={`font-medium ${deadlineDays < 0 ? "text-danger" : deadlineDays <= 14 ? "text-warning" : "text-neutral-700"}`}>
                {formatDateShort(process.nextDeadline)}{" "}
                <span className="font-normal text-neutral-400 text-xs">
                  {deadlineDays < 0
                    ? `(${Math.abs(deadlineDays)}d overdue)`
                    : deadlineDays === 0
                    ? "(today)"
                    : `(${deadlineDays}d)`}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button className="flex-1" onClick={onViewDetails}>
            See full details
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Upcoming items strip ───────────────────────────────────────────────────

const TODAY_DATE = new Date("2026-04-12");

function daysFromNow(dateString: string): number {
  return Math.ceil(
    (new Date(dateString).getTime() - TODAY_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );
}

interface UpcomingItem {
  date: string;
  description: string;
  daysLeft: number;
}

function buildUpcomingItems(processes: Process[]): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  for (const proc of processes) {
    for (const step of proc.steps) {
      if (step.deadline && step.status !== "completed") {
        items.push({
          date: step.deadline,
          description: `${step.title} — ${proc.name.split(" — ")[0] ?? proc.name}`,
          daysLeft: daysFromNow(step.deadline),
        });
      }
    }
  }
  return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 2);
}

// ── Main Component ─────────────────────────────────────────────────────────

export function OverviewTab({
  firstName,
  onSwitchToProcesses,
  onSwitchToChecklists,
}: {
  firstName: string;
  onSwitchToProcesses: () => void;
  onSwitchToChecklists: () => void;
}) {
  const [activeProcess, setActiveProcess] = useState<Process | null>(null);
  const { processes } = useProcessesContext();

  const activeProcesses = processes.filter((p) => p.status === "active");
  const upcomingItems = buildUpcomingItems(processes);

  return (
    <div className="space-y-8 pb-6">
      {/* ── Greeting ── */}
      <div>
        <p className="text-2xl font-semibold text-neutral-950">{greeting(firstName || "there")}</p>
        <p className="mt-1 text-sm text-neutral-400">{formatToday()}</p>
      </div>

      {/* ── Process circles ── */}
      {activeProcesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 py-14 text-center">
          <p className="text-base font-medium text-neutral-600">You haven&apos;t added a process yet.</p>
          <p className="mt-1 text-sm text-neutral-400">Start by telling us what you&apos;re trying to do.</p>
          <div className="mt-5">
            <Button onClick={onSwitchToProcesses}>
              <Plus className="h-4 w-4" />
              Add your first process
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Your active processes
          </p>
          <div className="flex flex-wrap gap-2">
            {activeProcesses.map((proc) => (
              <CircleProgress
                key={proc.id}
                process={proc}
                onTap={() => setActiveProcess(proc)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming items strip ── */}
      {upcomingItems.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              Upcoming
            </p>
            <button
              onClick={onSwitchToChecklists}
              className="text-xs font-medium text-navy hover:underline"
            >
              View checklists
            </button>
          </div>
          <div className="space-y-2">
            {upcomingItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white px-4 py-3"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-neutral-50 border border-neutral-100">
                  <CalendarClock className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-800">{item.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-neutral-700">{formatDateShort(item.date)}</p>
                  <p className={`text-[10px] ${item.daysLeft < 0 ? "text-danger" : item.daysLeft <= 7 ? "text-warning" : "text-neutral-400"}`}>
                    {item.daysLeft < 0
                      ? `${Math.abs(item.daysLeft)}d overdue`
                      : item.daysLeft === 0
                      ? "Today"
                      : `${item.daysLeft}d`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Disclaimer strip ── */}
      <p className="text-[11px] leading-relaxed text-neutral-400">
        migraDOCS provides document organisation and information only. This is not legal advice. For legal questions, consult a qualified immigration lawyer.
      </p>

      {/* ── Summary card overlay ── */}
      {activeProcess && (
        <ProcessSummaryCard
          process={activeProcess}
          onClose={() => setActiveProcess(null)}
          onViewDetails={() => {
            setActiveProcess(null);
            onSwitchToProcesses();
          }}
        />
      )}
    </div>
  );
}
