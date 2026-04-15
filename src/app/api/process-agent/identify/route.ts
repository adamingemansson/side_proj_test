import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { IdentifyResponseSchema } from "@/lib/process-agent/schemas";

const client = new Anthropic();

const SYSTEM = `You are a calm, plain-language assistant helping people identify which immigration or administrative process applies to their situation.

You must:
- Identify the most likely process or processes worldwide — not limited to any one country.
- Detect the relevant jurisdiction and destination country from context clues.
- Return 1–3 candidates ranked by confidence.
- Ask at most one short clarifying question if genuinely ambiguous.
- Never sound legalistic. Never guarantee outcomes.
- Always surface uncertainty.
- Return ONLY valid JSON. No markdown, no explanation.`;

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

    const historyBlock =
      history && history.length > 0
        ? "\n\nPrevious clarifications:\n" +
          history.map((h) => `Q: ${h.question}\nA: ${h.answer}`).join("\n")
        : "";

    const clarificationLine = clarification_answer
      ? `\nLatest clarification answer: "${clarification_answer}"`
      : "";

    const alreadyClarified = (history?.length ?? 0) > 0 || !!clarification_answer;

    const prompt = `User description: "${description}"${historyBlock}${clarificationLine}

Identify the most likely immigration or administrative process(es) for this person.

Consider:
- What country are they in / moving to?
- What is their nationality (if mentioned)?
- What is the purpose (work, study, family, residence, citizenship)?
- Which government authority handles this?

Return 1–3 candidates. Each candidate needs:
- id: a short snake_case identifier (e.g. "uk_student_visa", "se_work_permit", "de_residence_permit")
- name: formal process name in English
- description: 1–2 sentence plain-language explanation
- country: the country where the user currently is or is coming from
- destination_country: the country they are applying to / moving to
- authority_name: the government body responsible
- confidence: 0.0–1.0

${
  alreadyClarified
    ? "A clarification was already asked. Do NOT ask again — return your best candidates."
    : 'If the situation is genuinely ambiguous between multiple countries or process types, set needs_clarification to true and provide one short question with 2–4 answer options. Otherwise set needs_clarification to false.'
}

Return ONLY valid JSON:
{
  "candidates": [
    {
      "id": "...",
      "name": "...",
      "description": "...",
      "country": "...",
      "destination_country": "...",
      "authority_name": "...",
      "confidence": 0.0
    }
  ],
  "needs_clarification": false,
  "clarification_question": null,
  "clarification_options": null
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
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
      // Return raw parsed if shape is close enough
      return NextResponse.json(parsed);
    }

    return NextResponse.json(result.data);
  } catch (err) {
    console.error("[process-agent/identify]", err);
    return NextResponse.json({ error: "Failed to identify process" }, { status: 500 });
  }
}
