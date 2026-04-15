"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import type { CandidateProcess, FullPlan } from "@/lib/process-agent/schemas";
import type { ProcessRowWithSteps, ProcessStepRow, ProcessChecklistItemRow } from "@/lib/db";

// ── Demo data ──────────────────────────────────────────────────────────────

const DEMO_CANDIDATES: CandidateProcess[] = [
  {
    id: "se_work_permit",
    name: "Work Permit (Arbetstillstånd) — Sweden",
    description: "For non-EU/EEA nationals offered employment in Sweden.",
    country: "Sweden",
    destination_country: "Sweden",
    authority_name: "Migrationsverket",
    confidence: 0.92,
  },
  {
    id: "uk_student_visa",
    name: "UK Student Visa (Student Route)",
    description: "For international students studying full-time at a licensed UK institution.",
    country: "United Kingdom",
    destination_country: "United Kingdom",
    authority_name: "UK Home Office / UKVI",
    confidence: 0.87,
  },
  {
    id: "se_residence_permit_renewal",
    name: "Residence Permit Renewal — Sweden",
    description: "Renewing an existing residence permit to continue living in Sweden.",
    country: "Sweden",
    destination_country: "Sweden",
    authority_name: "Migrationsverket",
    confidence: 0.80,
  },
];

function buildDemoProcess(candidate: CandidateProcess): ProcessRowWithSteps {
  const now = new Date().toISOString();
  const processId = `demo-${Date.now()}`;

  const isUK = candidate.destination_country === "United Kingdom";

  const steps: (ProcessStepRow & { checklist_items: ProcessChecklistItemRow[] })[] = isUK
    ? [
        {
          id: `${processId}-s1`, process_id: processId, order_index: 0,
          title: "Receive CAS from your institution",
          description: "Your university issues a Confirmation of Acceptance for Studies (CAS) reference number.",
          status: "in_progress", estimated_duration: "Varies", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c1`, process_step_id: `${processId}-s1`, label: "Unconditional offer letter received", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c2`, process_step_id: `${processId}-s1`, label: "CAS number issued by institution", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
        {
          id: `${processId}-s2`, process_id: processId, order_index: 1,
          title: "Gather required documents",
          description: "Collect passport, proof of funds, and any required certificates before applying.",
          status: "not_started", estimated_duration: "1–2 weeks", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c3`, process_step_id: `${processId}-s2`, label: "Valid passport", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c4`, process_step_id: `${processId}-s2`, label: "Proof of funds (28 consecutive days in account)", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c5`, process_step_id: `${processId}-s2`, label: "English language certificate (if required)", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
        {
          id: `${processId}-s3`, process_id: processId, order_index: 2,
          title: "Apply online and pay fees",
          description: "Submit application on gov.uk and pay the visa fee and Immigration Health Surcharge.",
          status: "not_started", estimated_duration: "1–2 days", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c6`, process_step_id: `${processId}-s3`, label: "Online application submitted", completed: false, item_type: "action", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c7`, process_step_id: `${processId}-s3`, label: "Visa fee paid (£363)", completed: false, item_type: "payment", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c8`, process_step_id: `${processId}-s3`, label: "Immigration Health Surcharge paid", completed: false, item_type: "payment", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
        {
          id: `${processId}-s4`, process_id: processId, order_index: 3,
          title: "Biometrics appointment",
          description: "Attend a UKVI Visa Application Centre to submit biometric data.",
          status: "not_started", estimated_duration: "1–4 weeks to get appointment", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c9`, process_step_id: `${processId}-s4`, label: "VAC appointment booked", completed: false, item_type: "appointment", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c10`, process_step_id: `${processId}-s4`, label: "Biometrics submitted", completed: false, item_type: "appointment", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
        {
          id: `${processId}-s5`, process_id: processId, order_index: 4,
          title: "Await decision and collect BRP",
          description: "Standard processing up to 12 weeks. Collect your Biometric Residence Permit within 10 days of arrival.",
          status: "not_started", estimated_duration: "3–12 weeks", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c11`, process_step_id: `${processId}-s5`, label: "Visa decision received", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c12`, process_step_id: `${processId}-s5`, label: "BRP collected within 10 days of arrival", completed: false, item_type: "action", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
      ]
    : [
        {
          id: `${processId}-s1`, process_id: processId, order_index: 0,
          title: "Gather required documents",
          description: "Collect all supporting documents before submitting your application.",
          status: "in_progress", estimated_duration: "1–2 weeks", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c1`, process_step_id: `${processId}-s1`, label: "Valid passport (min. 6 months remaining)", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c2`, process_step_id: `${processId}-s1`, label: "Employment contract or offer letter", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c3`, process_step_id: `${processId}-s1`, label: "Passport-style photo", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
        {
          id: `${processId}-s2`, process_id: processId, order_index: 1,
          title: "Submit application online",
          description: "Apply via Migrationsverket's e-service and pay the application fee.",
          status: "not_started", estimated_duration: "1–3 days", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c4`, process_step_id: `${processId}-s2`, label: "Online application submitted", completed: false, item_type: "action", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c5`, process_step_id: `${processId}-s2`, label: "Application fee paid", completed: false, item_type: "payment", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c6`, process_step_id: `${processId}-s2`, label: "Case number saved", completed: false, item_type: "action", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
        {
          id: `${processId}-s3`, process_id: processId, order_index: 2,
          title: "Biometrics or service centre appointment",
          description: "Attend an appointment to submit biometric data if required by Migrationsverket.",
          status: "not_started", estimated_duration: "1–4 weeks", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c7`, process_step_id: `${processId}-s3`, label: "Check if appointment is required", completed: false, item_type: "action", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c8`, process_step_id: `${processId}-s3`, label: "Appointment booked", completed: false, item_type: "appointment", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c9`, process_step_id: `${processId}-s3`, label: "Biometrics submitted", completed: false, item_type: "appointment", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
        {
          id: `${processId}-s4`, process_id: processId, order_index: 3,
          title: "Await decision",
          description: "Processing typically takes 4–8 months. Track your case online using your case number.",
          status: "not_started", estimated_duration: "4–8 months", target_date: null, notes: null,
          created_at: now, updated_at: now,
          checklist_items: [
            { id: `${processId}-c10`, process_step_id: `${processId}-s4`, label: "Case number noted for tracking", completed: false, item_type: "action", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c11`, process_step_id: `${processId}-s4`, label: "Decision received", completed: false, item_type: "document", due_date: null, notes: null, created_at: now, updated_at: now },
            { id: `${processId}-c12`, process_step_id: `${processId}-s4`, label: "Permit card collected (if approved)", completed: false, item_type: "action", due_date: null, notes: null, created_at: now, updated_at: now },
          ],
        },
      ];

  return {
    id: processId,
    user_id: "demo",
    title: candidate.name,
    slug: null,
    status: "active",
    country: candidate.country,
    jurisdiction: candidate.destination_country ?? candidate.country,
    destination_country: candidate.destination_country ?? null,
    authority_name: candidate.authority_name ?? null,
    source_type: "ai_generated",
    summary: candidate.description,
    rationale: "Selected during demo walkthrough.",
    timeline_summary: isUK ? "Apply up to 6 months before course start. Decision typically 3–12 weeks." : "Applications typically decided within 4–8 months.",
    next_action: steps[0]?.checklist_items[0]?.label ?? "Start gathering documents.",
    next_deadline: null,
    confidence_score: candidate.confidence,
    uncertainty_notes: "This is demo data. Always verify requirements with the relevant authority.",
    created_at: now,
    updated_at: now,
    steps,
  };
}


const TODAY = new Date();

function daysFromNow(dateString: string): number {
  return Math.ceil(
    (new Date(dateString).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function confidenceBadgeVariant(score: number | null): "success" | "info" | "high" | "muted" {
  if (!score) return "muted";
  if (score >= 0.8) return "success";
  if (score >= 0.6) return "info";
  return "muted";
}

function confidenceLabel(score: number | null): string {
  if (!score) return "Unknown confidence";
  if (score >= 0.8) return "High confidence";
  if (score >= 0.6) return "Medium confidence";
  return "Low confidence";
}

const stepStatusIcon = (status: string) => {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.75} />;
  if (status === "in_progress") return <Clock className="h-4 w-4 text-navy" strokeWidth={1.75} />;
  if (status === "blocked") return <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={1.75} />;
  return <Circle className="h-4 w-4 text-neutral-300" strokeWidth={1.75} />;
};

// ── Checklist item ─────────────────────────────────────────────────────────

function ChecklistItem({
  item,
  processId,
  onToggle,
}: {
  item: ProcessChecklistItemRow;
  processId: string;
  onToggle: (itemId: string, completed: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={item.completed}
        onChange={(e) => onToggle(item.id, e.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-neutral-300 accent-navy"
      />
      <span className={`text-xs leading-relaxed ${item.completed ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
        {item.label}
        {item.notes && (
          <span className="ml-1 text-neutral-400 not-italic">— {item.notes}</span>
        )}
      </span>
    </label>
  );
}

// ── Process step row ───────────────────────────────────────────────────────

function ProcessStepRow({
  step,
  processId,
  onToggleItem,
}: {
  step: ProcessStepRow & { checklist_items: ProcessChecklistItemRow[] };
  processId: string;
  onToggleItem: (itemId: string, completed: boolean) => void;
}) {
  const [open, setOpen] = useState(step.status === "in_progress");
  const completedItems = step.checklist_items.filter((i) => i.completed).length;
  const totalItems = step.checklist_items.length;

  return (
    <div className={`rounded-lg border ${step.status === "in_progress" ? "border-navy/20 bg-navy-light/20" : "border-neutral-100 bg-white"}`}>
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="shrink-0">{stepStatusIcon(step.status)}</span>
        <span className="flex-1 min-w-0">
          <span className={`text-xs font-semibold ${step.status === "completed" ? "text-neutral-400" : "text-neutral-900"}`}>
            {step.title}
          </span>
          {step.estimated_duration && (
            <span className="ml-2 text-[10px] text-neutral-400">~{step.estimated_duration}</span>
          )}
        </span>
        {totalItems > 0 && (
          <span className="shrink-0 text-[10px] text-neutral-400">
            {completedItems}/{totalItems}
          </span>
        )}
        {open
          ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
          : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
        }
      </button>

      {open && (
        <div className="border-t border-neutral-100 px-4 py-3 space-y-3">
          {step.description && (
            <p className="text-xs leading-relaxed text-neutral-600">{step.description}</p>
          )}
          {step.checklist_items.length > 0 && (
            <div className="space-y-2">
              {step.checklist_items.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  processId={processId}
                  onToggle={onToggleItem}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Process card ───────────────────────────────────────────────────────────

function ProcessCard({ process, onChecklistToggle }: {
  process: ProcessRowWithSteps;
  onChecklistToggle: (processId: string, itemId: string, completed: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const steps = process.steps ?? [];
  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const currentStep = steps.find((s) => s.status === "in_progress");
  const deadlineDays = process.next_deadline ? daysFromNow(process.next_deadline) : null;

  const statusVariant: Record<string, "success" | "info" | "muted" | "urgent"> = {
    active: "info",
    completed: "success",
    on_hold: "muted",
    abandoned: "urgent",
  };

  return (
    <Card>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-950 leading-snug">{process.title}</h3>
              <Badge variant={statusVariant[process.status] ?? "muted"}>
                {process.status.replace("_", " ")}
              </Badge>
              {process.confidence_score !== null && (
                <Badge variant={confidenceBadgeVariant(process.confidence_score)}>
                  {confidenceLabel(process.confidence_score)}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500">
              {process.destination_country && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                  {process.destination_country}
                </span>
              )}
              {process.authority_name && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" strokeWidth={1.75} />
                  {process.authority_name}
                </span>
              )}
              <span>{completedSteps}/{totalSteps} steps</span>
            </div>
          </div>

          {deadlineDays !== null && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wide text-neutral-400">Next deadline</p>
              <p className={`mt-0.5 text-xs font-semibold ${
                deadlineDays < 0 ? "text-danger" : deadlineDays <= 14 ? "text-warning" : "text-neutral-700"
              }`}>
                {formatDateShort(process.next_deadline!)}
              </p>
              <p className="text-[10px] text-neutral-400">
                {deadlineDays < 0 ? `${Math.abs(deadlineDays)}d overdue` : `${deadlineDays}d`}
              </p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {totalSteps > 0 && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[10px] text-neutral-400">
              <span>Progress</span>
              <span>{Math.round((completedSteps / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-navy transition-all"
                style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Current step */}
        {currentStep && (
          <div className="mt-3 flex items-start gap-2 rounded border border-navy-light bg-navy-light/40 px-3 py-2">
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy" strokeWidth={1.75} />
            <div>
              <p className="text-[10px] font-semibold text-navy">Current step</p>
              <p className="text-[11px] text-neutral-700">{currentStep.title}</p>
            </div>
          </div>
        )}

        {/* Next action */}
        {process.next_action && (
          <p className="mt-2 text-[11px] text-neutral-500">
            <span className="font-medium text-neutral-700">Next: </span>
            {process.next_action}
          </p>
        )}

        {/* Timeline summary */}
        {process.timeline_summary && (
          <p className="mt-1 text-[11px] text-neutral-400">{process.timeline_summary}</p>
        )}

        {/* Expand / collapse steps */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 flex items-center gap-1 text-[11px] text-neutral-400 hover:text-navy transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Hide steps" : `Show ${totalSteps} steps`}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {steps.map((step) => (
              <ProcessStepRow
                key={step.id}
                step={step}
                processId={process.id}
                onToggleItem={(itemId, completed) =>
                  onChecklistToggle(process.id, itemId, completed)
                }
              />
            ))}

            {/* Uncertainty notes */}
            {process.uncertainty_notes && process.uncertainty_notes !== "None" && (
              <div className="mt-2 flex items-start gap-2 rounded border border-warning/20 bg-warning/5 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.75} />
                <p className="text-[11px] leading-relaxed text-neutral-600">
                  <span className="font-medium text-neutral-700">Note: </span>
                  {process.uncertainty_notes}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Add Process flow ───────────────────────────────────────────────────────

type FlowScreen =
  | { type: "describe" }
  | { type: "loading"; label: string }
  | { type: "clarify"; question: string; options: string[] | null }
  | { type: "select"; candidates: CandidateProcess[] }
  | { type: "confirm"; plan: FullPlan; candidate: CandidateProcess }
  | { type: "creating" }
  | { type: "error"; message: string };

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all ${
          i < current ? "h-2 w-2 bg-navy/40" : i === current ? "h-2 w-5 bg-navy" : "h-2 w-2 bg-neutral-200"
        }`} />
      ))}
    </div>
  );
}

function screenToStep(screen: FlowScreen): number {
  switch (screen.type) {
    case "describe": return 0;
    case "loading": return 1;
    case "clarify": return 1;
    case "select": return 1;
    case "confirm": return 2;
    case "creating": return 3;
    default: return 0;
  }
}

function AddProcessModal({
  onClose,
  onCreated,
  demoMode,
}: {
  onClose: () => void;
  onCreated: (p: ProcessRowWithSteps) => void;
  demoMode: boolean;
}) {
  const [screen, setScreen] = useState<FlowScreen>({ type: "describe" });
  const [description, setDescription] = useState("");
  const [clarifyHistory, setClarifyHistory] = useState<{ question: string; answer: string }[]>([]);
  const [clarifyInput, setClarifyInput] = useState("");

  // ── Identify ──────────────────────────────────────────────────────────────

  async function identify(desc: string, clarAnswer?: string) {
    if (demoMode) {
      setScreen({ type: "select", candidates: DEMO_CANDIDATES });
      return;
    }

    setScreen({ type: "loading", label: "Finding the right process…" });
    const newHistory = clarAnswer && screen.type === "clarify"
      ? [...clarifyHistory, { question: screen.question, answer: clarAnswer }]
      : clarifyHistory;

    try {
      const res = await fetch("/api/process-agent/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, clarification_answer: clarAnswer, history: newHistory }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();

      // Allow up to 2 clarification rounds before forcing a decision
      if (data.needs_clarification && data.clarification_question && newHistory.length < 2) {
        setClarifyHistory(newHistory);
        setClarifyInput("");
        setScreen({
          type: "clarify",
          question: data.clarification_question,
          options: data.clarification_options ?? null,
        });
      } else if (data.candidates?.length === 1 && data.candidates[0].confidence >= 0.8) {
        await buildPlan(data.candidates[0], desc, newHistory);
      } else {
        setScreen({ type: "select", candidates: data.candidates ?? [] });
      }
    } catch {
      setScreen({ type: "error", message: "Could not identify a process. Please check your connection and try again." });
    }
  }

  // ── Plan ──────────────────────────────────────────────────────────────────

  async function buildPlan(
    candidate: CandidateProcess,
    desc: string,
    history: { question: string; answer: string }[]
  ) {
    if (demoMode) {
      // Build a synthetic FullPlan from the candidate for the confirm screen
      const demoPlan: FullPlan = {
        title: candidate.name,
        jurisdiction: candidate.destination_country ?? candidate.country,
        destination_country: candidate.destination_country,
        authority_name: candidate.authority_name ?? "",
        summary: candidate.description,
        rationale: "Based on your description, this is the most likely applicable process.",
        confidence_score: candidate.confidence,
        uncertainty_notes: "This is demo data. Verify all requirements with the relevant authority before acting.",
        timeline_summary: candidate.destination_country === "United Kingdom"
          ? "Apply up to 6 months before your course or job start date. Decision typically within 3–12 weeks."
          : "Processing typically takes 4–8 months. Apply as early as possible.",
        next_action: "Start gathering required documents.",
        next_deadline: null,
        steps: [],
        source_notes: "Demo mode — no AI was used.",
        official_sources: [],
      };
      setScreen({ type: "confirm", plan: demoPlan, candidate });
      return;
    }

    setScreen({ type: "loading", label: "Building your process plan…" });
    try {
      const res = await fetch("/api/process-agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate, description: desc, answers: history }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setScreen({ type: "confirm", plan: data.plan, candidate });
    } catch {
      setScreen({ type: "error", message: "Could not generate the process plan. Please try again." });
    }
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async function createProcess() {
    if (screen.type !== "confirm") return;
    const { plan, candidate } = screen;

    // Demo mode: build the process locally, no API call
    if (demoMode) {
      const localProcess = buildDemoProcess(candidate);
      onCreated(localProcess); // handleCreated closes the modal
      return;
    }

    setScreen({ type: "creating" });
    try {
      const res = await fetch("/api/process-agent/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, source_type: "ai_generated" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error ?? "Could not save the process.";
        const details = data?.details ? ` (${JSON.stringify(data.details)})` : "";
        setScreen({ type: "error", message: msg + details });
        return;
      }
      onCreated(data.process); // handleCreated closes the modal
    } catch (err) {
      setScreen({ type: "error", message: "Could not save the process. Please check your connection and try again." });
      console.error("[createProcess]", err);
    }
  }

  // ── Back ──────────────────────────────────────────────────────────────────

  function goBack() {
    if (screen.type === "clarify" || screen.type === "select") {
      setScreen({ type: "describe" });
    } else if (screen.type === "confirm") {
      setScreen({ type: "select", candidates: [screen.candidate] });
    }
  }

  const showBack = ["clarify", "select", "confirm"].includes(screen.type);
  const totalSteps = 4;
  const currentStep = screenToStep(screen);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1b2e]/50 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.14)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-7 pb-0 sticky top-0 bg-white z-10 border-b border-neutral-50 pb-4">
          <ProgressDots total={totalSteps} current={currentStep} />
          <button onClick={onClose} className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-8 py-7">

          {/* ── Describe ── */}
          {screen.type === "describe" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold leading-snug text-neutral-950">
                  Tell us what you&apos;re trying to do.
                </h2>
                <p className="mt-2 text-sm text-neutral-500">
                  Describe your situation in plain language — where you are, where you&apos;re going, and why.
                </p>
              </div>
              <textarea
                className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/10 transition-colors"
                rows={5}
                placeholder={`e.g. "I'm a Swedish student doing an internship in London for 6 months."\nor "I've been offered a job in Stockholm and I'm moving from Nigeria."`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />
              <Button className="w-full py-3 text-base" disabled={!description.trim()} onClick={() => identify(description)}>
                Continue
              </Button>
            </div>
          )}

          {/* ── Loading ── */}
          {(screen.type === "loading" || screen.type === "creating") && (
            <div className="flex flex-col items-center gap-6 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-navy" strokeWidth={1.25} />
              <div className="text-center">
                <p className="text-lg font-semibold text-neutral-900">
                  {screen.type === "creating" ? "Saving your process…" : screen.label}
                </p>
                <p className="mt-1.5 text-sm text-neutral-500">This takes just a moment.</p>
              </div>
            </div>
          )}

          {/* ── Clarify ── */}
          {screen.type === "clarify" && (
            <div className="space-y-6">
              {showBack && (
                <button onClick={goBack} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">One quick question</p>
                <h2 className="mt-2 text-xl font-semibold leading-snug text-neutral-950">{screen.question}</h2>
              </div>
              {screen.options && screen.options.length > 0 ? (
                <div className="space-y-2.5">
                  {screen.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => identify(description, opt)}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-left text-base font-medium text-neutral-800 transition-all hover:border-navy hover:bg-navy-light/30"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/10 transition-colors"
                    rows={3}
                    placeholder="Your answer…"
                    value={clarifyInput}
                    onChange={(e) => setClarifyInput(e.target.value)}
                    autoFocus
                  />
                  <Button className="w-full py-3" onClick={() => identify(description, clarifyInput || "no further detail")}>
                    Continue
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── Select ── */}
          {screen.type === "select" && (
            <div className="space-y-5">
              {showBack && (
                <button onClick={goBack} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold leading-snug text-neutral-950">Which matches your situation?</h2>
              </div>
              <div className="space-y-2.5">
                {screen.candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => buildPlan(c, description, clarifyHistory)}
                    className="w-full rounded-xl border border-neutral-200 bg-white px-5 py-4 text-left transition-all hover:border-navy hover:bg-navy-light/30 hover:shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-950">{c.name}</p>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-600">{c.description}</p>
                        {c.destination_country && (
                          <p className="mt-1 text-[11px] text-neutral-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.destination_country}
                            {c.authority_name && ` · ${c.authority_name}`}
                          </p>
                        )}
                      </div>
                      {c.confidence >= 0.8 && (
                        <span className="mt-0.5 shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                          Best match
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400">Not sure? Pick the closest — you can adjust it later.</p>
            </div>
          )}

          {/* ── Confirm ── */}
          {screen.type === "confirm" && (
            <div className="space-y-5">
              {showBack && (
                <button onClick={goBack} className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-700 transition-colors">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Your process plan</p>
                <h2 className="mt-1.5 text-xl font-semibold text-neutral-950">{screen.plan.title}</h2>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-500">
                  {screen.plan.destination_country && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{screen.plan.destination_country}</span>
                  )}
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{screen.plan.authority_name}</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-neutral-700">{screen.plan.summary}</p>

              <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Why this applies to you</p>
                <p className="text-sm text-neutral-700">{screen.plan.rationale}</p>
              </div>

              <div className="rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Timeline</p>
                <p className="text-sm text-neutral-700">{screen.plan.timeline_summary}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                  Steps ({screen.plan.steps.length})
                </p>
                <div className="space-y-1.5">
                  {screen.plan.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-neutral-100 px-3 py-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-500">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-neutral-900">{step.title}</p>
                        {step.estimated_duration && (
                          <p className="text-[10px] text-neutral-400">~{step.estimated_duration}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {screen.plan.uncertainty_notes && screen.plan.uncertainty_notes !== "None" && (
                <div className="flex items-start gap-2.5 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
                  <p className="text-sm leading-relaxed text-neutral-700">{screen.plan.uncertainty_notes}</p>
                </div>
              )}

              <div className="flex items-start gap-2.5 rounded-xl border-l-[3px] border-navy-light bg-navy-light/40 px-4 py-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-navy" strokeWidth={1.75} />
                <p className="text-sm leading-relaxed text-neutral-700">
                  This is a plain-language overview based on publicly available information. It is not legal advice and may not reflect recent changes. Always verify requirements with the relevant authority.
                </p>
              </div>

              {screen.plan.official_sources && screen.plan.official_sources.length > 0 && (
                <div className="space-y-1">
                  {screen.plan.official_sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-navy hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {src.title}
                    </a>
                  ))}
                </div>
              )}

              <Button className="w-full py-3 text-base" onClick={createProcess}>
                Add to my processes
              </Button>
            </div>
          )}

          {/* ── Error ── */}
          {screen.type === "error" && (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
                <AlertTriangle className="h-7 w-7 text-warning" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-base font-semibold text-neutral-900">Something went wrong</p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500 max-w-xs">{screen.message}</p>
              </div>
              <Button variant="secondary" onClick={() => setScreen({ type: "describe" })}>Start over</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ProcessesTab({ onSwitchToOverview }: { onSwitchToOverview?: () => void }) {
  const { data: session, status } = useSession();
  const [demoMode, setDemoMode] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [processes, setProcesses] = useState<ProcessRowWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (demoMode) { setLoading(false); return; }
    try {
      const res = await fetch("/api/processes");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setProcesses(data.processes ?? []);
    } catch {
      setError("Could not load your processes.");
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => { fetchProcesses(); }, [fetchProcesses]);

  function toggleDemoMode() {
    setDemoMode((prev) => {
      const next = !prev;
      // Clear any existing error when enabling demo mode
      if (next) { setError(null); setLoading(false); }
      return next;
    });
  }

  const handleCreated = useCallback(async (p: ProcessRowWithSteps) => {
    // Optimistically add to the list immediately so the user sees it right away
    setProcesses((prev) => [p, ...prev]);
    setShowModal(false);

    if (!demoMode) {
      // Re-fetch from server in the background to get authoritative data
      // (steps might have been enriched server-side)
      try {
        const res = await fetch("/api/processes");
        if (res.ok) {
          const data = await res.json();
          setProcesses(data.processes ?? []);
        }
      } catch {
        // Optimistic update is already in place — not critical
      }
    }
  }, [demoMode]);

  const handleChecklistToggle = async (processId: string, itemId: string, completed: boolean) => {
    // Optimistic update
    setProcesses((prev) =>
      prev.map((p) =>
        p.id !== processId ? p : {
          ...p,
          steps: p.steps.map((s) => ({
            ...s,
            checklist_items: s.checklist_items.map((i) =>
              i.id === itemId ? { ...i, completed } : i
            ),
          })),
        }
      )
    );

    try {
      await fetch(`/api/processes/${processId}/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
    } catch {
      // Revert on failure
      fetchProcesses();
    }
  };

  const activeCount = processes.filter((p) => p.status === "active").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs text-neutral-500">
            {loading ? "Loading…" : `${activeCount} active · ${processes.length} total`}
          </p>
          <button
            onClick={toggleDemoMode}
            className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-colors ${
              demoMode
                ? "border-navy bg-navy text-white"
                : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300"
            }`}
          >
            {demoMode ? "Demo on" : "Demo"}
          </button>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Add new process
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-300" strokeWidth={1.5} />
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-neutral-700">
          {error}
        </div>
      )}

      {!loading && !error && processes.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-200 py-20 text-center">
          <p className="text-base font-medium text-neutral-600">No processes yet</p>
          <p className="mt-1 text-sm text-neutral-400">Click &quot;Add new process&quot; to get started.</p>
        </div>
      )}

      {!loading && processes.length > 0 && (
        <div className="space-y-3">
          {processes.map((proc) => (
            <ProcessCard
              key={proc.id}
              process={proc}
              onChecklistToggle={handleChecklistToggle}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Process information is based on publicly available guidance and may not reflect recent changes. Always verify requirements directly with the relevant authority.
        </p>
      </div>

      {showModal && (
        <AddProcessModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
          demoMode={demoMode}
        />
      )}

    </div>
  );
}
