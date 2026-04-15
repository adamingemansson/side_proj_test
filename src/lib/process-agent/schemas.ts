import { z } from "zod";

// ── Identify step ──────────────────────────────────────────────────────────

export const CandidateProcessSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  country: z.string(),
  jurisdiction: z.string().optional().nullable(),
  destination_country: z.string().optional().nullable(),
  authority_name: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1),
});

export type CandidateProcess = z.infer<typeof CandidateProcessSchema>;

export const IdentifyResponseSchema = z.object({
  candidates: z.array(CandidateProcessSchema).min(1),
  needs_clarification: z.boolean(),
  clarification_question: z.string().nullable(),
  clarification_options: z.array(z.string()).optional().nullable(),
});

export type IdentifyResponse = z.infer<typeof IdentifyResponseSchema>;

// ── Plan step ──────────────────────────────────────────────────────────────

export const PlanChecklistItemSchema = z.object({
  label: z.string(),
  item_type: z.enum(["document", "action", "appointment", "payment", "other"]),
  due_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type PlanChecklistItem = z.infer<typeof PlanChecklistItemSchema>;

export const PlanStepSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimated_duration: z.string().nullable().optional(),
  target_date: z.string().nullable().optional(),
  checklist_items: z.array(PlanChecklistItemSchema),
});

export type PlanStep = z.infer<typeof PlanStepSchema>;

export const FullPlanSchema = z.object({
  title: z.string(),
  jurisdiction: z.string(),
  destination_country: z.string().optional().nullable(),
  authority_name: z.string(),
  summary: z.string(),
  rationale: z.string(),
  confidence_score: z.number().min(0).max(1),
  uncertainty_notes: z.string(),
  timeline_summary: z.string(),
  next_action: z.string(),
  next_deadline: z.string().nullable().optional(),
  steps: z.array(PlanStepSchema).min(1),
  source_notes: z.string().optional().nullable(),
  official_sources: z
    .array(z.object({ title: z.string(), url: z.string() }))
    .optional()
    .nullable(),
});

export type FullPlan = z.infer<typeof FullPlanSchema>;

// ── Create request (from client to /api/process-agent/create) ─────────────

export const CreateProcessRequestSchema = z.object({
  plan: FullPlanSchema,
  source_type: z.enum(["ai_generated", "catalog", "hybrid"]).default("ai_generated"),
});

export type CreateProcessRequest = z.infer<typeof CreateProcessRequestSchema>;
