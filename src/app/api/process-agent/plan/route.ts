import { NextRequest, NextResponse } from "next/server";
import { generatePlan } from "@/lib/process-agent/planner";
import type { CandidateProcess } from "@/lib/process-agent/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidate, description, answers, extra_context } = body as {
      candidate?: CandidateProcess;
      description?: string;
      answers?: { question: string; answer: string }[];
      /** Reserved for web search results — pass null/undefined today */
      extra_context?: string;
    };

    if (!candidate || !description) {
      return NextResponse.json(
        { error: "candidate and description are required" },
        { status: 400 }
      );
    }

    const plan = await generatePlan(
      candidate,
      description,
      answers ?? [],
      extra_context
    );

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("[process-agent/plan]", err);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
