"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  History,
  Info,
  Link2,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocuments } from "@/hooks/useDocuments";
import { useProcesses } from "@/hooks/useProcesses";
import { categoryLabel, formatDateShort, statusLabel } from "@/lib/utils";
import type { Document, DocumentCategory, DocumentStatus, Process } from "@/types";

// Demo today
const TODAY = new Date("2026-04-12");
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function daysFromNow(dateString: string): number {
  return Math.ceil(
    (new Date(dateString).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function isExpiringSoon(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - TODAY.getTime();
  return diff > 0 && diff <= SIXTY_DAYS_MS;
}

function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate).getTime() < TODAY.getTime();
}

// ── Status badge map ───────────────────────────────────────────────────────

const STATUS_BADGE: Record<DocumentStatus, "urgent" | "high" | "success" | "muted" | "default"> = {
  action_required: "urgent",
  pending_review: "high",
  reviewed: "default",
  completed: "success",
  expired: "muted",
};

// ── Delete confirmation ────────────────────────────────────────────────────

function DeleteConfirm({
  docTitle,
  onConfirm,
  onCancel,
}: {
  docTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 p-3">
      <p className="text-xs font-medium text-neutral-900">
        Remove &quot;{docTitle}&quot; from your library?
      </p>
      <p className="mt-1 text-[11px] text-neutral-600">
        This removes the document record from migraDOCS. The original file is not affected.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          onClick={onConfirm}
          className="rounded border border-danger/40 bg-danger/10 px-3 py-1 text-xs font-medium text-danger hover:bg-danger/20 transition-colors"
        >
          Remove
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Structured summary panel ───────────────────────────────────────────────

function StructuredSummary({ doc, processes }: { doc: Document; processes: Process[] }) {
  const [checklist, setChecklist] = useState(doc.preparationChecklist);

  const toggleCheck = (id: string) =>
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );

  const linkedProcesses = processes.filter(
    (p) => doc.processIds?.includes(p.id) || p.documentIds.includes(doc.id)
  );

  return (
    <div className="space-y-4">
      {/* Inline disclaimer */}
      <div className="flex items-start gap-2.5 rounded-r-lg border-l-[3px] border-navy-light bg-navy-light/40 px-3 py-2.5">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy" strokeWidth={1.75} />
        <p className="text-[11px] leading-relaxed text-neutral-700">
          <strong className="font-semibold">Informational guidance only.</strong>{" "}
          This is a structured reading of your document, not legal advice. Verify all dates and requirements against your original document. For legal questions, consult a qualified immigration lawyer.
        </p>
      </div>

      {/* What this document is */}
      {doc.whatThisIs && (
        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            What this document is
          </p>
          <p className="text-[12px] leading-relaxed text-neutral-700">{doc.whatThisIs}</p>
        </section>
      )}

      {!doc.whatThisIs && (
        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Summary
          </p>
          <p className="text-[12px] leading-relaxed text-neutral-700">{doc.summary}</p>
        </section>
      )}

      {/* What it requires */}
      {doc.whatItRequires && doc.whatItRequires.length > 0 && (
        <section>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            What it requires
          </p>
          <ul className="space-y-1">
            {doc.whatItRequires.map((req, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-navy" />
                <span className="text-[12px] leading-relaxed text-neutral-700">{req}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Deadlines */}
      {doc.deadlines && doc.deadlines.length > 0 && (
        <section>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Deadlines
          </p>
          <div className="space-y-1.5">
            {doc.deadlines.map((dl, i) => {
              const days = daysFromNow(dl.date);
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded border px-3 py-2 ${
                    days < 0
                      ? "border-danger/30 bg-danger/5"
                      : days <= 14
                      ? "border-warning/30 bg-warning/5"
                      : "border-neutral-200 bg-neutral-50"
                  }`}
                >
                  <span className="text-[12px] text-neutral-700">{dl.label}</span>
                  <div className="text-right">
                    <span className={`text-[12px] font-medium ${
                      days < 0 ? "text-danger" : days <= 14 ? "text-warning" : "text-neutral-800"
                    }`}>
                      {formatDateShort(dl.date)}
                    </span>
                    <p className="text-[10px] text-neutral-400">
                      {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d remaining`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Consequences of inaction */}
      {doc.consequences && (
        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Consequences of inaction
          </p>
          <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.75} />
            <p className="text-[12px] leading-relaxed text-neutral-700">{doc.consequences}</p>
          </div>
        </section>
      )}

      {/* Next steps checklist */}
      {doc.nextSteps && doc.nextSteps.length > 0 && (
        <section>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Next steps
          </p>
          <ul className="space-y-2">
            {doc.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-[9px] font-bold text-neutral-500">
                  {i + 1}
                </div>
                <span className="text-[12px] leading-relaxed text-neutral-700">{step}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Preparation checklist (interactive) */}
      {checklist.length > 0 && (
        <section>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
              Preparation checklist
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
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-200" strokeWidth={1.75} />
                )}
                <span className={`text-[12px] leading-snug ${item.completed ? "line-through text-neutral-400" : "text-neutral-700"}`}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Authority explainer */}
      {doc.authorityExplainer && (
        <section>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            About the issuing authority
          </p>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
            <div className="flex items-start gap-2.5">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
              <div>
                <p className="text-[12px] font-medium text-neutral-900">{doc.authorityExplainer.name}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">{doc.authorityExplainer.role}</p>
                {doc.authorityExplainer.contact && (
                  <p className="mt-1 text-[11px] text-neutral-500">{doc.authorityExplainer.contact}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Linked processes */}
      {linkedProcesses.length > 0 && (
        <section>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            Linked processes
          </p>
          <div className="space-y-1">
            {linkedProcesses.map((proc) => (
              <div key={proc.id} className="flex items-center gap-2 text-[12px] text-neutral-700">
                <Link2 className="h-3 w-3 shrink-0 text-neutral-400" strokeWidth={1.75} />
                {proc.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What this is not telling you */}
      {doc.whatItIsNotTelling && (
        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
            What this is not telling you
          </p>
          <div className="flex items-start gap-2.5 rounded-r-lg border-l-[3px] border-neutral-300 bg-neutral-50 px-3 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
            <p className="text-[12px] leading-relaxed text-neutral-600">{doc.whatItIsNotTelling}</p>
          </div>
        </section>
      )}

      {/* Referral card */}
      {doc.referralCard && (
        <section>
          <div className="rounded-lg border border-info/30 bg-info/5 p-4">
            <div className="flex items-start gap-2.5">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-info" strokeWidth={1.75} />
              <div>
                <p className="text-[12px] font-semibold text-neutral-900">Consider getting advice</p>
                <p className="mt-1 text-[11px] font-medium text-neutral-700">Who: {doc.referralCard.who}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                  <strong>What they can help with: </strong>{doc.referralCard.what}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                  <strong>Why: </strong>{doc.referralCard.why}
                </p>
                <p className="mt-2 text-[10px] text-neutral-400">
                  migraDOCS does not endorse specific advisers. Verify credentials before engaging professional services.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Document row ───────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  expanded,
  onToggle,
  onDelete,
  processes,
}: {
  doc: Document;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  processes: Process[];
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const expiringSoon = doc.expiryDate && isExpiringSoon(doc.expiryDate);
  const expired = doc.expiryDate && isExpired(doc.expiryDate);
  const expiryDays = doc.expiryDate ? daysFromNow(doc.expiryDate) : null;

  const linkedProcesses = processes.filter(
    (p) => doc.processIds?.includes(p.id) || p.documentIds.includes(doc.id)
  );

  const hasVersionHistory = doc.versions && doc.versions.length > 0;

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white transition-shadow ${
        expiringSoon
          ? "border-warning/40"
          : expired
          ? "border-danger/40"
          : "border-neutral-200"
      }`}
    >
      {/* Expiry warning strip */}
      {(expiringSoon || expired) && (
        <div className={`flex items-center gap-2 px-4 py-1.5 text-[11px] ${
          expired ? "bg-danger/5 text-danger" : "bg-warning/5 text-warning"
        }`}>
          <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={1.75} />
          <span className="font-medium">
            {expired
              ? `Expired ${Math.abs(expiryDays!)}d ago`
              : `Expires in ${expiryDays}d — ${formatDateShort(doc.expiryDate!)}`}
          </span>
        </div>
      )}

      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50">
          <FileText className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <button
            onClick={onToggle}
            className="flex w-full items-start justify-between gap-2 text-left"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-neutral-950 leading-snug">{doc.title}</p>
                <Badge variant={STATUS_BADGE[doc.status]}>{statusLabel(doc.status)}</Badge>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-500">{doc.issuingAuthority}</p>

              {/* Metadata chips */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" strokeWidth={1.75} />
                  Received {formatDateShort(doc.dateReceived)}
                </span>
                <span>{categoryLabel(doc.category)}</span>
                {doc.expiryDate && (
                  <span className={expired ? "text-danger font-medium" : expiringSoon ? "text-warning font-medium" : ""}>
                    Expires {formatDateShort(doc.expiryDate)}
                  </span>
                )}
                {linkedProcesses.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" strokeWidth={1.75} />
                    {linkedProcesses.length} {linkedProcesses.length === 1 ? "process" : "processes"}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-neutral-400">
              {expanded ? (
                <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
              )}
            </div>
          </button>

          {/* Action row */}
          <div className="mt-2 flex items-center gap-2">
            {hasVersionHistory && (
              <button
                onClick={() => setShowVersionHistory((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <History className="h-3 w-3" strokeWidth={1.75} />
                {showVersionHistory ? "Hide" : "Show"} version history
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm((v) => !v)}
              className="ml-auto flex items-center gap-1 text-[10px] text-neutral-400 hover:text-danger transition-colors"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.75} />
              Remove
            </button>
          </div>

          {/* Version history */}
          {showVersionHistory && hasVersionHistory && (
            <div className="mt-2 space-y-1.5 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                Version history
              </p>
              {/* Current version */}
              <div className="flex items-start gap-2">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                <div>
                  <p className="text-[11px] font-medium text-neutral-900">Current version</p>
                  <p className="text-[10px] text-neutral-500">Uploaded {formatDateShort(doc.dateReceived)}</p>
                </div>
              </div>
              {/* Previous versions */}
              {doc.versions!.map((v) => (
                <div key={v.id} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                  <div>
                    <p className="text-[11px] text-neutral-500 line-through">
                      Version — {formatDateShort(v.uploadedAt)}
                    </p>
                    {v.summary && (
                      <p className="text-[10px] text-neutral-400">{v.summary}</p>
                    )}
                    <Badge variant="muted" className="mt-1">Superseded</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Delete confirm */}
          {showDeleteConfirm && (
            <DeleteConfirm
              docTitle={doc.title}
              onConfirm={() => {
                setShowDeleteConfirm(false);
                onDelete();
              }}
              onCancel={() => setShowDeleteConfirm(false)}
            />
          )}
        </div>
      </div>

      {/* Expanded summary */}
      {expanded && (
        <div className="border-t border-neutral-100 px-4 pb-5 pt-4">
          <StructuredSummary doc={doc} processes={processes} />
        </div>
      )}
    </div>
  );
}

// ── Group header ───────────────────────────────────────────────────────────

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <div className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-neutral-200 px-1.5">
        <span className="text-[9px] font-bold text-neutral-500">{count}</span>
      </div>
      <div className="flex-1 border-t border-neutral-100" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function DocumentsTab() {
  const { documents } = useDocuments();
  const { processes } = useProcesses();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visibleDocs = documents.filter((d) => !deletedIds.has(d.id));

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  // Group by category
  const grouped: Partial<Record<DocumentCategory, Document[]>> = {};
  for (const doc of visibleDocs) {
    if (!grouped[doc.category]) grouped[doc.category] = [];
    grouped[doc.category]!.push(doc);
  }

  // Sort categories by priority (action_required first)
  const sortedCategories = (Object.keys(grouped) as DocumentCategory[]).sort((a, b) => {
    const urgencyA = grouped[a]!.some((d) => d.status === "action_required") ? 0 : 1;
    const urgencyB = grouped[b]!.some((d) => d.status === "action_required") ? 0 : 1;
    return urgencyA - urgencyB;
  });

  // Expiry warnings summary
  const expiringSoonDocs = visibleDocs.filter(
    (d) => d.expiryDate && isExpiringSoon(d.expiryDate)
  );

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-neutral-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-neutral-950">{visibleDocs.length}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Total</p>
        </div>
        <div className="rounded-lg border border-neutral-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-danger">
            {visibleDocs.filter((d) => d.status === "action_required").length}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Action needed</p>
        </div>
        <div className="rounded-lg border border-neutral-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-warning">{expiringSoonDocs.length}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Expiring soon</p>
        </div>
        <div className="hidden rounded-lg border border-neutral-100 bg-white p-3 text-center sm:block">
          <p className="text-lg font-bold text-success">
            {visibleDocs.filter((d) => d.status === "completed").length}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-500">Completed</p>
        </div>
      </div>

      {/* Expiry warning banner */}
      {expiringSoonDocs.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
          <div>
            <p className="text-xs font-semibold text-neutral-900">
              {expiringSoonDocs.length} {expiringSoonDocs.length === 1 ? "document expires" : "documents expire"} within 60 days
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-600">
              {expiringSoonDocs.map((d) => d.title).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Document groups */}
      {visibleDocs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-neutral-200" strokeWidth={1.5} />
          <p className="text-sm font-medium text-neutral-600">No documents in your library</p>
          <p className="mt-1 text-xs text-neutral-400">Upload a document to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <div key={category}>
              <GroupHeader
                label={categoryLabel(category)}
                count={grouped[category]!.length}
              />
              <div className="mt-2 space-y-2">
                {grouped[category]!.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    expanded={expandedId === doc.id}
                    onToggle={() => toggleExpand(doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    processes={processes}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom note */}
      <div className="flex items-start gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Expiry dates and deadlines are extracted automatically. Always verify against your original documents.
          migraDOCS stores only the extracted summary — not the original file.
        </p>
      </div>
    </div>
  );
}
