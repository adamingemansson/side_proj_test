"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  FileText,
  Info,
  MapPin,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProcesses } from "@/hooks/useProcesses";
import { DEMO_DOCUMENTS } from "@/lib/data/documents";
import { formatDateShort } from "@/lib/utils";
import type { Process, ProcessStep, ProcessStepStatus } from "@/types";

const TODAY = new Date("2026-04-12");

function daysFromNow(dateString: string): number {
  return Math.ceil(
    (new Date(dateString).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  );
}

// ── Node styling by status ─────────────────────────────────────────────────

interface NodeStyle {
  ring: string;
  bg: string;
  icon: React.ReactNode;
  labelColor: string;
  rowBg: string;
}

function nodeStyle(status: ProcessStepStatus, order: number): NodeStyle {
  switch (status) {
    case "completed":
      return {
        ring: "border-neutral-300",
        bg: "bg-neutral-100",
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2} />,
        labelColor: "text-neutral-400",
        rowBg: "",
      };
    case "in_progress":
      return {
        ring: "border-navy",
        bg: "bg-navy",
        icon: <span className="text-[11px] font-bold text-white leading-none">{order}</span>,
        labelColor: "text-neutral-950",
        rowBg: "bg-navy-light/30 rounded-lg",
      };
    case "blocked":
      return {
        ring: "border-danger",
        bg: "bg-danger/10",
        icon: <XCircle className="h-3.5 w-3.5 text-danger" strokeWidth={2} />,
        labelColor: "text-danger",
        rowBg: "bg-danger/5 rounded-lg",
      };
    default: // not_started
      return {
        ring: "border-neutral-300",
        bg: "bg-white",
        icon: <span className="text-[11px] font-medium text-neutral-400 leading-none">{order}</span>,
        labelColor: "text-neutral-500",
        rowBg: "",
      };
  }
}

// ── Step detail panel ──────────────────────────────────────────────────────

function StepDetail({ step, process }: { step: ProcessStep; process: Process }) {
  const [checklist, setChecklist] = useState(step.checklistItems ?? []);

  const toggleCheck = (id: string) =>
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );

  const linkedDocs = DEMO_DOCUMENTS.filter(
    (d) =>
      (step.requiredDocuments ?? []).some((req) =>
        d.title.toLowerCase().includes(req.split(" ")[0].toLowerCase())
      ) || process.documentIds.includes(d.id)
  ).slice(0, 3);

  const days = step.deadline ? daysFromNow(step.deadline) : null;

  return (
    <div className="mt-2 space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      {/* Description */}
      <p className="text-[12px] leading-relaxed text-neutral-700">{step.description}</p>

      {/* Deadline */}
      {step.deadline && (
        <div
          className={`flex items-center justify-between rounded border px-3 py-2 ${
            days !== null && days < 0
              ? "border-danger/30 bg-danger/5"
              : days !== null && days <= 14
              ? "border-warning/30 bg-warning/5"
              : "border-neutral-100 bg-neutral-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarClock className={`h-3.5 w-3.5 ${days !== null && days < 0 ? "text-danger" : days !== null && days <= 14 ? "text-warning" : "text-neutral-400"}`} strokeWidth={1.75} />
            <span className="text-[11px] font-medium text-neutral-700">Deadline</span>
          </div>
          <div className="text-right">
            <span className={`text-[12px] font-semibold ${days !== null && days < 0 ? "text-danger" : days !== null && days <= 14 ? "text-warning" : "text-neutral-800"}`}>
              {formatDateShort(step.deadline)}
            </span>
            {days !== null && (
              <p className="text-[10px] text-neutral-400">
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d remaining`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {step.notes && (
        <div className="flex items-start gap-2 rounded border border-neutral-100 bg-neutral-50 px-3 py-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
          <p className="text-[11px] leading-relaxed text-neutral-600">{step.notes}</p>
        </div>
      )}

      {/* Required documents */}
      {step.requiredDocuments && step.requiredDocuments.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Required for this step
          </p>
          <ul className="space-y-1">
            {step.requiredDocuments.map((doc, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-navy" />
                <span className="text-[11px] text-neutral-700">{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Linked documents in library */}
      {linkedDocs.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Documents in your library
          </p>
          <div className="space-y-1">
            {linkedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 rounded border border-neutral-100 bg-neutral-50 px-2.5 py-1.5">
                <FileText className="h-3 w-3 shrink-0 text-neutral-400" strokeWidth={1.75} />
                <span className="text-[11px] text-neutral-700 truncate">{doc.title}</span>
                <Badge variant={doc.status === "action_required" ? "urgent" : "muted"} className="ml-auto shrink-0 text-[9px]">
                  {doc.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      {checklist.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Step checklist
            </p>
            <span className="text-[10px] text-neutral-400">
              {checklist.filter((c) => c.completed).length}/{checklist.length}
            </span>
          </div>
          <ul className="space-y-1.5">
            {checklist.map((item) => (
              <li
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className="flex cursor-pointer items-start gap-2"
              >
                {item.completed ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={1.75} />
                ) : (
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300" strokeWidth={1.75} />
                )}
                <span
                  className={`text-[11px] leading-snug ${
                    item.completed ? "line-through text-neutral-400" : "text-neutral-700"
                  }`}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Single timeline node ───────────────────────────────────────────────────

function TimelineNode({
  step,
  process,
  isLast,
  expanded,
  onToggle,
}: {
  step: ProcessStep;
  process: Process;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const style = nodeStyle(step.status, step.order);
  const days = step.deadline ? daysFromNow(step.deadline) : null;
  const isOverdue = days !== null && days < 0;
  const isUrgent = days !== null && days >= 0 && days <= 7;

  return (
    <div className="relative flex gap-4">
      {/* Column: node + connector line */}
      <div className="flex flex-col items-center">
        <button
          onClick={onToggle}
          className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-shadow ${style.ring} ${style.bg} ${
            step.status === "in_progress"
              ? "shadow-sm shadow-navy/20 hover:shadow-md hover:shadow-navy/30"
              : "hover:shadow-sm"
          }`}
          aria-expanded={expanded}
          aria-label={`Step ${step.order}: ${step.title}`}
        >
          {style.icon}
        </button>
        {!isLast && (
          <div className={`mt-1 w-0.5 flex-1 ${
            step.status === "completed" ? "bg-neutral-200" : "bg-neutral-100"
          }`} />
        )}
      </div>

      {/* Right: content */}
      <div className={`mb-4 min-w-0 flex-1 pb-1 ${step.status === "in_progress" ? "rounded-lg p-3 " + style.rowBg : ""}`}>
        <button
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-xs font-semibold leading-snug ${style.labelColor}`}>
                {step.title}
              </p>
              {step.status === "in_progress" && (
                <Badge variant="info">Current</Badge>
              )}
              {step.status === "completed" && (
                <Badge variant="success">Done</Badge>
              )}
              {step.status === "blocked" && (
                <Badge variant="urgent">Blocked</Badge>
              )}
              {isOverdue && step.status !== "completed" && (
                <Badge variant="urgent">Overdue</Badge>
              )}
              {isUrgent && step.status !== "completed" && !isOverdue && (
                <Badge variant="high">Due soon</Badge>
              )}
            </div>

            {step.deadline && step.status !== "completed" && (
              <p className={`mt-0.5 text-[11px] ${isOverdue ? "text-danger" : isUrgent ? "text-warning" : "text-neutral-500"}`}>
                <CalendarClock className="mr-1 inline h-3 w-3" strokeWidth={1.75} />
                {formatDateShort(step.deadline)}
                {days !== null && (
                  <span className="ml-1">
                    ({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`})
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="shrink-0 text-neutral-400">
            {expanded ? (
              <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
            )}
          </div>
        </button>

        {expanded && (
          <StepDetail step={step} process={process} />
        )}
      </div>
    </div>
  );
}

// ── Single process timeline ────────────────────────────────────────────────

function ProcessTimeline({ process }: { process: Process }) {
  const [expandedStep, setExpandedStep] = useState<string | null>(() => {
    // Default-expand the current in_progress step
    const current = process.steps.find((s) => s.status === "in_progress");
    return current?.id ?? null;
  });

  const completedCount = process.steps.filter((s) => s.status === "completed").length;
  const deadlineDays = process.nextDeadline ? daysFromNow(process.nextDeadline) : null;

  const toggleStep = (id: string) =>
    setExpandedStep((prev) => (prev === id ? null : id));

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      {/* Process header */}
      <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-950 leading-snug">{process.name}</h3>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />
                {process.country}
              </span>
              <span>{completedCount}/{process.steps.length} steps complete</span>
            </div>
          </div>
          {process.nextDeadline && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wide text-neutral-400">Next deadline</p>
              <p className={`text-xs font-semibold ${
                deadlineDays !== null && deadlineDays < 0 ? "text-danger" :
                deadlineDays !== null && deadlineDays <= 14 ? "text-warning" : "text-neutral-800"
              }`}>
                {formatDateShort(process.nextDeadline)}
              </p>
              {deadlineDays !== null && (
                <p className="text-[10px] text-neutral-400">
                  {deadlineDays < 0
                    ? `${Math.abs(deadlineDays)}d overdue`
                    : `${deadlineDays}d remaining`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-navy transition-all"
              style={{ width: `${(completedCount / process.steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pb-2 pt-5">
        {process.steps.map((step, i) => (
          <TimelineNode
            key={step.id}
            step={step}
            process={process}
            isLast={i === process.steps.length - 1}
            expanded={expandedStep === step.id}
            onToggle={() => toggleStep(step.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function TimelinesTab() {
  const { processes } = useProcesses();
  const activeProcesses = processes.filter((p) => p.status === "active");

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-r-lg border-l-[3px] border-navy-light bg-navy-light/40 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy" strokeWidth={1.75} />
        <p className="text-[11px] leading-relaxed text-neutral-700">
          <strong className="font-semibold">Process steps and deadlines</strong> are based on published guidance and your uploaded documents. They may not reflect individual circumstances or recent changes. Click any step to view details. Always verify deadlines with the relevant authority.
        </p>
      </div>

      {activeProcesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
          <Clock className="mb-3 h-8 w-8 text-neutral-200" strokeWidth={1.5} />
          <p className="text-sm font-medium text-neutral-600">No active processes</p>
          <p className="mt-1 text-xs text-neutral-400">Add a process in the Processes tab to see its timeline here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {activeProcesses.map((proc) => (
            <ProcessTimeline key={proc.id} process={proc} />
          ))}
        </div>
      )}
    </div>
  );
}
