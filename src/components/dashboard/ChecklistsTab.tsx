"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Info,
  ListChecks,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProcessesContext } from "@/contexts/ProcessesContext";
import { formatDateShort } from "@/lib/utils";
import type { ChecklistItem, Process } from "@/types";

const TODAY = new Date("2026-04-12");

function daysFromNow(dateString: string): number {
  return Math.ceil(
    (new Date(dateString).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  );
}

// ── Combined checklist item with metadata ──────────────────────────────────

interface RichChecklistItem extends ChecklistItem {
  stepTitle?: string;
  stepDeadline?: string;
  source: "step" | "document";
  documentTitle?: string;
  documentId?: string;
}

function buildProcessChecklist(process: Process): RichChecklistItem[] {
  const items: RichChecklistItem[] = [];
  for (const step of process.steps) {
    for (const item of step.checklistItems ?? []) {
      items.push({
        ...item,
        stepTitle: step.title,
        stepDeadline: step.deadline,
        source: "step",
      });
    }
  }
  return items;
}

// ── Checklist item row ─────────────────────────────────────────────────────

function ChecklistRow({
  item,
  onToggle,
}: {
  item: RichChecklistItem;
  onToggle: () => void;
}) {
  const effectiveDueDate = item.dueDate ?? item.stepDeadline;
  const days = effectiveDueDate ? daysFromNow(effectiveDueDate) : null;
  const isOverdue = days !== null && days < 0 && !item.completed;
  const isDueSoon = days !== null && days >= 0 && days <= 7 && !item.completed;

  return (
    <div
      className={`rounded-lg border transition-colors ${
        item.completed
          ? "border-neutral-100 bg-neutral-50"
          : isOverdue
          ? "border-danger/30 bg-danger/5"
          : isDueSoon
          ? "border-warning/20 bg-warning/5"
          : "border-neutral-200 bg-white"
      }`}
    >
      <div
        onClick={onToggle}
        className="flex cursor-pointer items-start gap-3 px-3 py-2.5"
      >
        {/* Toggle */}
        <div className="mt-0.5 shrink-0">
          {item.completed ? (
            <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.75} />
          ) : (
            <Circle
              className={`h-4 w-4 ${isOverdue ? "text-danger" : isDueSoon ? "text-warning" : "text-neutral-300"}`}
              strokeWidth={1.75}
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs leading-snug ${
              item.completed
                ? "line-through text-neutral-400"
                : isOverdue
                ? "font-medium text-danger"
                : "font-medium text-neutral-900"
            }`}
          >
            {item.label}
          </p>

          {/* Metadata line */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-neutral-400">
            {item.stepTitle && (
              <span className="flex items-center gap-1">
                <ArrowRight className="h-2.5 w-2.5 shrink-0 text-neutral-300" />
                {item.stepTitle}
              </span>
            )}
            {item.documentTitle && (
              <span className="flex items-center gap-1">
                <FileText className="h-2.5 w-2.5 shrink-0 text-neutral-300" />
                {item.documentTitle}
              </span>
            )}
            {effectiveDueDate && !item.completed && (
              <span
                className={`flex items-center gap-1 font-medium ${
                  isOverdue ? "text-danger" : isDueSoon ? "text-warning" : "text-neutral-500"
                }`}
              >
                <CalendarClock className="h-2.5 w-2.5 shrink-0" />
                {formatDateShort(effectiveDueDate)}
                {days !== null && (
                  <span>
                    ({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Right-side badges */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isOverdue && (
            <Badge variant="urgent">Overdue</Badge>
          )}
          {isDueSoon && !isOverdue && (
            <Badge variant="high">Due soon</Badge>
          )}
          {item.completed && (
            <Badge variant="success">Done</Badge>
          )}
        </div>
      </div>

      {/* Legal action warning */}
      {item.isLegalAction && !item.completed && (
        <div className="flex items-start gap-2 border-t border-danger/10 bg-danger/5 px-3 py-2">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.75} />
          <p className="text-[11px] leading-relaxed text-neutral-700">
            <strong className="font-semibold text-danger">Legal action required.</strong>{" "}
            This step may require qualified legal support. migraDOCS cannot advise on legal proceedings — consider consulting an immigration lawyer before acting.
          </p>
        </div>
      )}

      {/* Deadline warning on incomplete items */}
      {isOverdue && (
        <div className="flex items-start gap-2 border-t border-danger/10 bg-danger/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.75} />
          <p className="text-[11px] leading-relaxed text-danger">
            This item is past its deadline. Check whether the action is still possible and contact the relevant authority if needed.
          </p>
        </div>
      )}

      {/* Document back-link */}
      {item.documentId && (
        <div className="flex items-center gap-2 border-t border-neutral-100 px-3 py-1.5">
          <FileText className="h-3 w-3 shrink-0 text-neutral-300" strokeWidth={1.75} />
          <a
            href={`/documents/${item.documentId}`}
            className="text-[10px] text-navy hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View document: {item.documentTitle}
          </a>
          <ExternalLink className="h-2.5 w-2.5 text-neutral-300" />
        </div>
      )}
    </div>
  );
}

// ── Process checklist section ──────────────────────────────────────────────

function ProcessChecklist({
  process,
  onToggleItem,
}: {
  process: Process;
  onToggleItem: (processId: string, itemId: string) => void;
}) {
  // Derive items from live process data so toggling updates reactively
  const items = buildProcessChecklist(process);

  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const overdueCount = items.filter((i) => {
    const effectiveDue = i.dueDate ?? i.stepDeadline;
    return effectiveDue && daysFromNow(effectiveDue) < 0 && !i.completed;
  }).length;
  const legalCount = items.filter((i) => i.isLegalAction && !i.completed).length;

  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-950 leading-snug">{process.name}</h3>
            <div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />
                {process.country}
              </span>
              <span>{completed}/{total} complete</span>
            </div>
            {/* Alert chips */}
            {(overdueCount > 0 || legalCount > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {overdueCount > 0 && (
                  <Badge variant="urgent">
                    <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                    {overdueCount} overdue
                  </Badge>
                )}
                {legalCount > 0 && (
                  <Badge variant="urgent">
                    <ShieldAlert className="mr-1 h-2.5 w-2.5" />
                    {legalCount} legal action
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-neutral-950">{pct}%</p>
            <p className="text-[10px] text-neutral-400">complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-navy transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 p-4">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-400">No checklist items for this process.</p>
        ) : (
          <>
            {/* Overdue first */}
            {items
              .slice()
              .sort((a, b) => {
                const aOverdue = !a.completed && (a.dueDate ?? a.stepDeadline) && daysFromNow((a.dueDate ?? a.stepDeadline)!) < 0;
                const bOverdue = !b.completed && (b.dueDate ?? b.stepDeadline) && daysFromNow((b.dueDate ?? b.stepDeadline)!) < 0;
                const aLegal = a.isLegalAction && !a.completed ? -1 : 0;
                const bLegal = b.isLegalAction && !b.completed ? -1 : 0;
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;
                if (aLegal !== bLegal) return aLegal - bLegal;
                if (a.completed && !b.completed) return 1;
                if (!a.completed && b.completed) return -1;
                return 0;
              })
              .map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  onToggle={() => onToggleItem(process.id, item.id)}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ChecklistsTab() {
  const { processes, toggleChecklistItem } = useProcessesContext();
  const activeProcesses = processes.filter((p) => p.status === "active");

  const totalOverdue = activeProcesses.reduce((sum, proc) => {
    const items = buildProcessChecklist(proc);
    return sum + items.filter((i) => {
      const due = i.dueDate ?? i.stepDeadline;
      return due && daysFromNow(due) < 0 && !i.completed;
    }).length;
  }, 0);

  const totalLegal = activeProcesses.reduce((sum, proc) => {
    const items = buildProcessChecklist(proc);
    return sum + items.filter((i) => i.isLegalAction && !i.completed).length;
  }, 0);

  return (
    <div className="space-y-5">
      {/* Legal action global disclaimer */}
      {totalLegal > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
          <p className="text-xs leading-relaxed text-neutral-800">
            <strong className="font-semibold text-danger">
              {totalLegal} item{totalLegal > 1 ? "s" : ""} require legal action.
            </strong>{" "}
            migraDOCS does not provide legal advice. These steps may have serious legal consequences — consult a qualified immigration lawyer before proceeding.
          </p>
        </div>
      )}

      {/* Overdue global alert */}
      {totalOverdue > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
          <p className="text-xs leading-relaxed text-neutral-800">
            <strong className="font-semibold">
              {totalOverdue} overdue item{totalOverdue > 1 ? "s" : ""}.
            </strong>{" "}
            Review these urgently. Some deadlines may have passed — contact the relevant authority to understand your options.
          </p>
        </div>
      )}

      {/* Informational note */}
      <div className="flex items-start gap-2.5 rounded-r-lg border-l-[3px] border-navy-light bg-navy-light/40 px-4 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy" strokeWidth={1.75} />
        <p className="text-[11px] leading-relaxed text-neutral-700">
          Checklists draw from your process steps. Completing an item saves automatically and updates the progress shown in the Overview. Always verify completed actions against official records.
        </p>
      </div>

      {/* Process checklists */}
      {activeProcesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 py-16 text-center">
          <ListChecks className="mb-3 h-8 w-8 text-neutral-200" strokeWidth={1.5} />
          <p className="text-sm font-medium text-neutral-600">No active processes</p>
          <p className="mt-1 text-xs text-neutral-400">Add a process in the Processes tab to see checklists here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {activeProcesses.map((proc) => (
            <ProcessChecklist
              key={proc.id}
              process={proc}
              onToggleItem={toggleChecklistItem}
            />
          ))}
        </div>
      )}

      {/* Bottom disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
        <p className="text-[11px] leading-relaxed text-neutral-500">
          migraDOCS is an information and organisation tool. Checklist items do not constitute legal advice. For steps involving legal proceedings, deadlines, or formal submissions, always consult a qualified immigration lawyer.
        </p>
      </div>
    </div>
  );
}
