import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { IdentifyResponseSchema } from "@/lib/process-agent/schemas";
import { rankTemplates } from "@/lib/process-catalog/matcher";
import type { ProcessTemplate } from "@/lib/process-catalog/templates";

const client = new Anthropic();

// Minimum keyword score to return template matches directly without Claude
const TEMPLATE_CONFIDENCE_THRESHOLD = 0.5;

function templateToCandidate(t: ProcessTemplate, score: number) {
  return {
    id: t.id,
    name: t.title,
    description: t.summary,
    country: t.destination_country,
    destination_country: t.destination_country,
    authority_name: t.authority_name,
    confidence: Math.min(0.7 + score * 0.25, 0.95),
  };
}

const SYSTEM = `Immigration process identifier. Return ONLY valid JSON, no prose.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, clarification_answer, history } = body as {
      description?: string;
      clarification_answer?: string;
      history?: { question: string; answer: string }[];
    };

    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }

    const newHistory = clarification_answer && history
      ? [...history, { question: (history[history.length - 1]?.question ?? ""), answer: clarification_answer }]
      : history ?? [];

    // ── Template pre-check ─────────────────────────────────────────────────
    // For well-known processes we can skip the Claude call entirely.
    // Only bypass if this is the first call (no clarification history yet).
    if (newHistory.length === 0 && !clarification_answer) {
      const templateMatches = rankTemplates(description, 3, TEMPLATE_CONFIDENCE_THRESHOLD);
      if (templateMatches.length > 0) {
        return NextResponse.json({
          candidates: templateMatches.map(({ template, score }) =>
            templateToCandidate(template, score)
          ),
          needs_clarification: false,
          clarification_question: null,
          clarification_options: null,
        });
      }
    }

    // ── Claude fallback ────────────────────────────────────────────────────
    const alreadyClarified = newHistory.length >= 2 || !!clarification_answer;

    const historyBlock =
      newHistory.length > 0
        ? "\nClarifications:\n" +
          newHistory.map((h) => `Q: ${h.question}\nA: ${h.answer}`).join("\n")
        : "";

    const clarificationLine = clarification_answer
      ? `\nLatest answer: "${clarification_answer}"`
      : "";

    const prompt = `Situation: "${description}"${historyBlock}${clarificationLine}

Identify 1–3 immigration/admin process candidates.

Return JSON:
{
  "candidates": [
    {
      "id": "<snake_case e.g. uk_student_visa>",
      "name": "<formal name>",
      "description": "<1 sentence>",
      "country": "<origin country>",
      "destination_country": "<destination country>",
      "authority_name": "<authority>",
      "confidence": <0.0–1.0>
    }
  ],
  "needs_clarification": ${alreadyClarified ? "false" : "<true if genuinely ambiguous>"},
  "clarification_question": ${alreadyClarified ? "null" : '"<one short question, or null>"'},
  "clarification_options": ${alreadyClarified ? "null" : '["<option>", ...] or null'}
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      return NextResponse.json({ error: "Unexpected model response" }, { status: 500 });
    }

    const cleaned = block.text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const result = IdentifyResponseSchema.safeParse(parsed);

    if (!result.success) {
      console.error("[identify] Zod error:", result.error.flatten());
      return NextResponse.json(parsed);
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("[process-agent/identify]", err);
    return NextResponse.json({ error: "Failed to identify process" }, { status: 500 });
  }
}
