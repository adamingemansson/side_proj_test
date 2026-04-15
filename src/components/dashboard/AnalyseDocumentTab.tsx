"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Info,
  Loader2,
  ShieldAlert,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateShort } from "@/lib/utils";
import type { ProcessRow } from "@/lib/db";

// ── Types ──────────────────────────────────────────────────────────────────

interface DocumentAnalysis {
  title: string;
  issuingAuthority: string;
  category: string;
  whatThisIs: string;
  whatItRequires: string[];
  deadlines: { label: string; date: string }[];
  consequences: string;
  nextSteps: string[];
  authorityExplainer: { name: string; role: string; contact?: string };
  whatItIsNotTelling: string;
  needsReferral: boolean;
  referralCard?: { who: string; what: string; why: string };
  summary: string;
  confidence: "high" | "medium" | "low";
  confidenceScore: number;
  tags: string[];
}

// ── Demo data ──────────────────────────────────────────────────────────────

const DEMO_ANALYSIS: DocumentAnalysis = {
  title: "Residence Permit Renewal Notice",
  issuingAuthority: "Migrationsverket (Swedish Migration Agency)",
  category: "residence_permit",
  whatThisIs:
    "This is a formal notice from Migrationsverket informing you that your current residence permit will expire and that you need to submit a renewal application. It confirms your current permit type and the expiry date.",
  whatItRequires: [
    "Submit a renewal application via Migrationsverket's online portal",
    "Provide a valid passport (minimum 6 months validity beyond intended stay)",
    "Upload proof of continued employment or studies",
    "Attach recent payslips or financial documentation",
    "Pay the applicable renewal fee (SEK 2 000 for work-based permits)",
  ],
  deadlines: [
    { label: "Renewal application must be submitted", date: "2026-05-01" },
    { label: "Current permit expires", date: "2026-06-30" },
  ],
  consequences:
    "If you do not submit your renewal application before your current permit expires, you may lose your right to remain in Sweden and could be required to leave the country.",
  nextSteps: [
    "Log in to Migrationsverket's e-service and start a renewal application",
    "Gather your employment contract and last three payslips",
    "Book a biometrics appointment at your nearest Migrationsverket office",
    "Submit the complete application and pay the fee",
  ],
  authorityExplainer: {
    name: "Migrationsverket",
    role: "The Swedish Migration Agency — responsible for residence and work permits, citizenship, and asylum applications in Sweden.",
    contact: "migrationsverket.se · 0771-235 235",
  },
  whatItIsNotTelling:
    "This notice does not tell you how long the processing of your renewal will take (typically 4–12 months), whether you can continue working during processing (generally yes, if you applied before expiry), or what additional documents may be requested.",
  needsReferral: false,
  summary:
    "Migrationsverket renewal notice requiring application before current permit expires on 30 June 2026.",
  confidence: "high",
  confidenceScore: 0.91,
  tags: ["residence-permit", "renewal", "migrationsverket", "sweden", "deadline"],
};

// ── Utilities ──────────────────────────────────────────────────────────────

const TODAY = new Date();

function daysFromNow(dateString: string): number {
  return Math.ceil(
    (new Date(dateString).getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24)
  );
}

const confidenceVariant = (c: string): "success" | "info" | "muted" =>
  c === "high" ? "success" : c === "medium" ? "info" : "muted";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXT = ".pdf,.jpg,.jpeg,.png,.webp";

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
      {children}
    </p>
  );
}

function AnalysisResults({
  analysis,
  actionNote,
  onActionNoteChange,
}: {
  analysis: DocumentAnalysis;
  actionNote: string;
  onActionNoteChange: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-neutral-950">{analysis.title}</h3>
          <p className="mt-0.5 text-xs text-neutral-500">{analysis.issuingAuthority}</p>
        </div>
        <Badge variant={confidenceVariant(analysis.confidence)}>
          {analysis.confidence} confidence
        </Badge>
      </div>

      {/* Tags */}
      {analysis.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {analysis.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] text-neutral-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-r-lg border-l-[3px] border-navy-light bg-navy-light/40 px-3 py-2.5">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy" strokeWidth={1.75} />
        <p className="text-[11px] leading-relaxed text-neutral-700">
          <strong className="font-semibold">Informational only.</strong> This is not legal advice.
          Verify all dates against your original document.
        </p>
      </div>

      {/* What this is */}
      {analysis.whatThisIs && (
        <div>
          <SectionHeading>What this document is</SectionHeading>
          <p className="text-sm leading-relaxed text-neutral-700">{analysis.whatThisIs}</p>
        </div>
      )}

      {/* What it requires */}
      {analysis.whatItRequires.length > 0 && (
        <div>
          <SectionHeading>What it requires from you</SectionHeading>
          <ul className="space-y-1.5">
            {analysis.whatItRequires.map((req, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy" strokeWidth={1.75} />
                <span className="text-sm leading-relaxed text-neutral-700">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Deadlines */}
      {analysis.deadlines.length > 0 && (
        <div>
          <SectionHeading>Deadlines</SectionHeading>
          <div className="space-y-1.5">
            {analysis.deadlines.map((dl, i) => {
              const days = daysFromNow(dl.date);
              const urgent = days <= 14;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded border px-3 py-2 ${
                    urgent
                      ? "border-warning/30 bg-warning/5"
                      : "border-neutral-200 bg-neutral-50"
                  }`}
                >
                  <span className="text-sm text-neutral-700">{dl.label}</span>
                  <div className="text-right">
                    <p className={`text-xs font-medium ${urgent ? "text-warning" : "text-neutral-800"}`}>
                      {formatDateShort(dl.date)}
                    </p>
                    {days <= 60 && (
                      <p className="text-[10px] text-neutral-400">
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Consequences */}
      {analysis.consequences && (
        <div>
          <SectionHeading>Consequences of inaction</SectionHeading>
          <div className="flex items-start gap-2 rounded border border-warning/30 bg-warning/5 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.75} />
            <p className="text-sm leading-relaxed text-neutral-700">{analysis.consequences}</p>
          </div>
        </div>
      )}

      {/* Next steps */}
      {analysis.nextSteps.length > 0 && (
        <div>
          <SectionHeading>Next steps</SectionHeading>
          <ol className="space-y-1.5">
            {analysis.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed text-neutral-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* What it's not telling you */}
      {analysis.whatItIsNotTelling && (
        <div>
          <SectionHeading>What this document doesn&apos;t tell you</SectionHeading>
          <div className="flex items-start gap-2 rounded-r-lg border-l-[3px] border-neutral-300 bg-neutral-50 px-3 py-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
            <p className="text-sm leading-relaxed text-neutral-600">{analysis.whatItIsNotTelling}</p>
          </div>
        </div>
      )}

      {/* Authority */}
      {analysis.authorityExplainer?.name && (
        <div>
          <SectionHeading>About the issuing authority</SectionHeading>
          <div className="flex items-start gap-2.5 rounded border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-medium text-neutral-900">{analysis.authorityExplainer.name}</p>
              <p className="mt-0.5 text-xs text-neutral-600">{analysis.authorityExplainer.role}</p>
              {analysis.authorityExplainer.contact && (
                <p className="mt-0.5 text-xs text-neutral-400">{analysis.authorityExplainer.contact}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Referral card */}
      {analysis.needsReferral && analysis.referralCard && (
        <div className="rounded-lg border border-info/30 bg-info/5 p-4">
          <div className="flex items-start gap-2.5">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-info" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-neutral-900">Consider getting professional advice</p>
              <p className="mt-1 text-xs text-neutral-700">
                <strong>Who: </strong>{analysis.referralCard.who}
              </p>
              <p className="mt-0.5 text-xs text-neutral-600">
                <strong>Why: </strong>{analysis.referralCard.why}
              </p>
              <p className="mt-2 text-[10px] text-neutral-400">
                migraDOCS does not endorse specific advisers and cannot predict case outcomes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action note */}
      <div>
        <SectionHeading>Your action note</SectionHeading>
        <textarea
          className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/10 transition-colors"
          rows={3}
          placeholder="What are you going to do with this document? e.g. 'Book biometrics appointment by 1 May. Need to gather payslips first.'"
          value={actionNote}
          onChange={(e) => onActionNoteChange(e.target.value)}
        />
        <p className="mt-1 text-[10px] text-neutral-400">
          This note is saved locally for your reference.
        </p>
      </div>
    </div>
  );
}

// ── Main tab ───────────────────────────────────────────────────────────────

type TabState =
  | { stage: "idle" }
  | { stage: "analysing"; fileName: string }
  | { stage: "done"; analysis: DocumentAnalysis; fileName: string }
  | { stage: "error"; message: string };

export function AnalyseDocumentTab() {
  const { data: session } = useSession();
  const [state, setState] = useState<TabState>({ stage: "idle" });
  const [processes, setProcesses] = useState<ProcessRow[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [actionNote, setActionNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's processes for the selector
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/processes")
      .then((r) => r.json())
      .then((d) => setProcesses(d.processes ?? []))
      .catch(() => {});
  }, [session]);

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setState({ stage: "error", message: "Unsupported file type. Please upload a PDF, JPG, or PNG." });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setState({ stage: "error", message: "File is too large. Maximum size is 25 MB." });
      return;
    }

    setState({ stage: "analysing", fileName: file.name });
    setActionNote("");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/process-document", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok || !data.analysis) {
        setState({ stage: "error", message: data.error ?? "Analysis failed. Please try again." });
        return;
      }

      setState({ stage: "done", analysis: data.analysis, fileName: file.name });
    } catch {
      setState({ stage: "error", message: "Could not reach the analysis service. Please check your connection." });
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function runDemo() {
    setState({ stage: "analysing", fileName: "sample-document.pdf" });
    setActionNote("");
    setTimeout(() => {
      setState({ stage: "done", analysis: DEMO_ANALYSIS, fileName: "sample-document.pdf" });
    }, 1800);
  }

  function reset() {
    setState({ stage: "idle" });
    setActionNote("");
  }

  const isDone = state.stage === "done";
  const isAnalysing = state.stage === "analysing";

  return (
    <div className="mx-auto max-w-2xl space-y-5">

      {/* Process selector */}
      <Card>
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-neutral-700 mb-2">
            Link to a process <span className="font-normal text-neutral-400">(optional)</span>
          </p>
          <div className="relative">
            <select
              value={selectedProcessId}
              onChange={(e) => setSelectedProcessId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 pr-8 text-sm text-neutral-800 focus:border-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy/10 transition-colors"
            >
              <option value="">Not linked to a process</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-neutral-400" strokeWidth={1.75} />
          </div>
        </CardContent>
      </Card>

      {/* Upload area */}
      {state.stage === "idle" && (
        <Card>
          <CardContent className="p-0">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-14 transition-colors ${
                dragOver ? "border-navy bg-navy-light/30" : "border-neutral-200 bg-neutral-50"
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-sm">
                <Upload className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-800">
                  Drop your document here, or{" "}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-navy underline underline-offset-2 hover:text-navy/80"
                  >
                    browse
                  </button>
                </p>
                <p className="mt-1 text-xs text-neutral-400">PDF, JPG, PNG or WebP · max 25 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXT}
                className="hidden"
                onChange={handleInputChange}
              />
              <div className="flex items-center gap-2">
                <div className="h-px w-16 bg-neutral-200" />
                <span className="text-xs text-neutral-400">or</span>
                <div className="h-px w-16 bg-neutral-200" />
              </div>
              <Button variant="secondary" onClick={runDemo} className="text-xs">
                Try with sample document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysing */}
      {isAnalysing && (
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-14">
            <Loader2 className="h-10 w-10 animate-spin text-navy" strokeWidth={1.25} />
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-900">Analysing document…</p>
              <p className="mt-1 text-xs text-neutral-500">
                {state.fileName} · This takes a moment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {isDone && (
        <>
          {/* File header + reset */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-success/30 bg-success/10">
                <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900">{state.fileName}</p>
                <p className="text-[10px] text-neutral-400">{state.analysis.summary}</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-500 hover:border-neutral-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              New document
            </button>
          </div>

          <Card>
            <CardContent className="p-5">
              <AnalysisResults
                analysis={state.analysis}
                actionNote={actionNote}
                onActionNoteChange={setActionNote}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Error */}
      {state.stage === "error" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Something went wrong</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500 max-w-xs">{state.message}</p>
            </div>
            <Button variant="secondary" onClick={reset}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {/* Footer disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.75} />
        <p className="text-[11px] leading-relaxed text-neutral-500">
          Documents are sent directly to the analysis service and are not stored on migraDOCS servers. Analysis is based on the document content only and does not constitute legal advice.
        </p>
      </div>
    </div>
  );
}
