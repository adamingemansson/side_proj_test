import Anthropic from "@anthropic-ai/sdk";
import { FullPlanSchema, type FullPlan, type CandidateProcess } from "./schemas";
import { matchTemplate } from "@/lib/process-catalog/matcher";

const client = new Anthropic();

const PLAN_SYSTEM = `Immigration process planner. Output ONLY valid JSON. Be concise — use short bullet-style text (max 1–2 lines per field). No prose paragraphs. Never claim legal certainty. Express uncertainty in uncertainty_notes.`;

/**
 * Generate a full process plan.
 *
 * Strategy:
 * 1. Template match ≥ 0.3 → use template steps as backbone, Claude personalises metadata only.
 * 2. No match → Claude generates full plan from training knowledge.
 *
 * extraContext is reserved for web search results (v2 — no-op today).
 */
export async function generatePlan(
  candidate: CandidateProcess,
  userDescription: string,
  answers: { question: string; answer: string }[],
  extraContext?: string
): Promise<FullPlan> {
  const templateMatch = matchTemplate(candidate.id, userDescription, extraContext);

  const answersBlock =
    answers.length > 0
      ? answers
          .filter((a) => a.answer && a.answer !== "—")
          .map((a) => `- ${a.question}: ${a.answer}`)
          .join("\n")
      : "No extra details.";

  const webContextBlock = extraContext
    ? `\nOfficial source context:\n${extraContext}`
    : "";

  let prompt: string;

  if (templateMatch && templateMatch.score >= 0.3) {
    const t = templateMatch.template;
    const stepsJson = JSON.stringify(
      t.steps.map((s) => ({
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

    prompt = `Process: "${t.title}"
Jurisdiction: ${t.jurisdiction} | Authority: ${t.authority_name}
User: "${userDescription}"
Details: ${answersBlock}${webContextBlock}

Use the steps below exactly. Generate ONLY these fields personalised to the user's situation:
- summary: 2–3 short bullets (what this process is for them)
- rationale: 1 sentence (why it applies)
- confidence_score: 0.0–1.0
- uncertainty_notes: 1 sentence of what you are unsure about, or "None"
- timeline_summary: 1 line (e.g. "4–8 months; apply 3 months before permit expires")
- next_action: 1 sentence — the single most important next step
- next_deadline: ISO date or null
- source_notes: 1 line
- official_sources: ${JSON.stringify(t.official_sources ?? [])}
- title: use template title unless situation warrants a more specific name

Steps (do not modify):
${stepsJson}

Return ONLY valid JSON:
{
  "title": "...", "jurisdiction": "${t.jurisdiction}", "destination_country": "${t.destination_country}",
  "authority_name": "${t.authority_name}", "summary": "...", "rationale": "...",
  "confidence_score": 0.0, "uncertainty_notes": "...", "timeline_summary": "...",
  "next_action": "...", "next_deadline": null, "steps": [...],
  "source_notes": "...", "official_sources": [...]
}`;
  } else {
    prompt = `Generate a process plan.
Process: "${candidate.name}"
Destination: ${candidate.destination_country ?? candidate.country ?? "Unknown"}
Authority: ${candidate.authority_name ?? "Unknown"}
User: "${userDescription}"
Details: ${answersBlock}${webContextBlock}

Keep all text fields concise (bullet points or 1 line max per field). Use publicly available facts only.

Return ONLY valid JSON:
{
  "title": "...",
  "jurisdiction": "...",
  "destination_country": "...",
  "authority_name": "...",
  "summary": "...",
  "rationale": "...",
  "confidence_score": <0.0–1.0>,
  "uncertainty_notes": "...",
  "timeline_summary": "...",
  "next_action": "...",
  "next_deadline": null,
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
  "source_notes": "...",
  "official_sources": [{ "title": "...", "url": "..." }]
}`;
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
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
    console.error("[planner] Zod validation failed:", result.error.flatten());
    return parsed as FullPlan;
  }

  return result.data;
}
