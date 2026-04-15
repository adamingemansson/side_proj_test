import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { FullPlanSchema, type FullPlan, type CandidateProcess } from "./schemas";
import { matchTemplate } from "@/lib/process-catalog/matcher";

const client = new Anthropic();

const PLAN_SYSTEM = `You are a calm, plain-language assistant that helps people understand and track immigration and administrative processes.

Your task is to produce a structured, accurate process plan in JSON.

Rules:
- Use only factual, commonly published procedural information.
- Do NOT invent fees, form numbers, or processing times you are not confident about.
- Always express uncertainty clearly in the uncertainty_notes field.
- Never claim legal certainty or guarantee outcomes.
- This tool is for organisation and information only — not legal advice.
- Return ONLY valid JSON matching the schema. No markdown, no explanation.`;

/**
 * Generate a full process plan.
 *
 * Strategy (in order):
 * 1. If a template matches the process, use it as the structural backbone
 *    and ask Claude to personalise rationale/timeline/next_action only.
 * 2. Otherwise ask Claude to generate the full plan from its training knowledge.
 *
 * extraContext is reserved for web search results (v2).
 * Passing it today is a no-op — the prompt already has a slot for it.
 */
export async function generatePlan(
  candidate: CandidateProcess,
  userDescription: string,
  answers: { question: string; answer: string }[],
  extraContext?: string
): Promise<FullPlan> {
  const templateMatch = matchTemplate(
    candidate.id,
    userDescription,
    extraContext
  );

  const answersBlock =
    answers.length > 0
      ? answers
          .filter((a) => a.answer && a.answer !== "—")
          .map((a) => `- ${a.question}: ${a.answer}`)
          .join("\n")
      : "No additional details provided.";

  const webContextBlock = extraContext
    ? `\n\nAdditional context from official sources:\n${extraContext}`
    : "";

  let prompt: string;

  if (templateMatch && templateMatch.score >= 0.3) {
    const t = templateMatch.template;
    const stepsJson = JSON.stringify(
      t.steps.map((s, i) => ({
        title: s.title,
        description: s.description,
        estimated_duration: s.estimated_duration ?? null,
        target_date: null,
        checklist_items: s.checklist_items.map((c) => ({
          label: c.label,
          item_type: c.item_type,
          due_date: null,
          notes: c.notes ?? null,
        })),
      })),
      null,
      2
    );

    prompt = `The user is tracking the following process: "${t.title}"

User's description: "${userDescription}"
User details:
${answersBlock}${webContextBlock}

Use the steps below as the structural backbone. Do not change the steps or checklist items — only adjust target_date or notes if the user's details make that appropriate.

Generate the following fields based on the user's specific situation:
- title (use the template title unless the user's situation warrants a more specific name)
- jurisdiction: "${t.jurisdiction}"
- destination_country: "${t.destination_country}"
- authority_name: "${t.authority_name}"
- summary (2–3 sentences, plain language, specific to the user's situation)
- rationale (1–2 sentences: why this process applies to this user)
- confidence_score (0.0–1.0, be honest)
- uncertainty_notes (what you are not certain about, or "None" if confident)
- timeline_summary (plain-language estimate)
- next_action (the single most important thing to do right now)
- next_deadline (ISO date string or null)
- source_notes (brief note on the source of this information)
- official_sources: ${JSON.stringify(t.official_sources ?? [])}

Steps (use exactly these — do not modify structure):
${stepsJson}

Return ONLY valid JSON:
{
  "title": "...",
  "jurisdiction": "...",
  "destination_country": "...",
  "authority_name": "...",
  "summary": "...",
  "rationale": "...",
  "confidence_score": 0.0,
  "uncertainty_notes": "...",
  "timeline_summary": "...",
  "next_action": "...",
  "next_deadline": null,
  "steps": [...],
  "source_notes": "...",
  "official_sources": [...]
}`;
  } else {
    prompt = `Generate a structured process plan for the following situation.

Process identified: "${candidate.name}"
Country/jurisdiction: ${candidate.destination_country ?? candidate.country ?? "Unknown"}
Authority: ${candidate.authority_name ?? "Unknown"}

User's description: "${userDescription}"
User details:
${answersBlock}${webContextBlock}

Generate a complete, accurate process plan based on publicly available information about this process.
Use the user's specific details to personalise the rationale, timeline, and next action.
If you are uncertain about specific requirements, say so in uncertainty_notes.

Return ONLY valid JSON:
{
  "title": "<specific process name>",
  "jurisdiction": "<country or region>",
  "destination_country": "<country they are moving to / applying in>",
  "authority_name": "<name of the government authority>",
  "summary": "<2–3 sentence plain-language overview>",
  "rationale": "<why this process applies to this user>",
  "confidence_score": <0.0–1.0>,
  "uncertainty_notes": "<what you are uncertain about, or 'None'>",
  "timeline_summary": "<plain-language timeline estimate>",
  "next_action": "<single most important next step>",
  "next_deadline": <null or "YYYY-MM-DD">,
  "steps": [
    {
      "title": "...",
      "description": "...",
      "estimated_duration": "...",
      "target_date": null,
      "checklist_items": [
        { "label": "...", "item_type": "document|action|appointment|payment|other", "due_date": null, "notes": null }
      ]
    }
  ],
  "source_notes": "<brief note on information source>",
  "official_sources": [{ "title": "...", "url": "..." }]
}`;
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: PLAN_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected model response type");

  const cleaned = block.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  const result = FullPlanSchema.safeParse(parsed);

  if (!result.success) {
    // Log validation errors but try to return the raw parsed object if it has the minimum shape
    console.error("[planner] Zod validation failed:", result.error.flatten());
    // Attempt a lenient parse — surface errors but don't hard-fail
    return parsed as FullPlan;
  }

  return result.data;
}
