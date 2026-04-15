import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/db";
import { CreateProcessRequestSchema } from "@/lib/process-agent/schemas";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateProcessRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { plan, source_type } = parsed.data;

    // ── 1. Insert process row ────────────────────────────────────────────────
    const { data: processRow, error: processError } = await supabase
      .from("processes")
      .insert({
        user_id: session.user.id,
        title: plan.title,
        status: "active",
        country: plan.jurisdiction,
        jurisdiction: plan.jurisdiction,
        destination_country: plan.destination_country ?? null,
        authority_name: plan.authority_name,
        source_type,
        summary: plan.summary,
        rationale: plan.rationale,
        timeline_summary: plan.timeline_summary,
        next_action: plan.next_action,
        next_deadline: plan.next_deadline ?? null,
        confidence_score: plan.confidence_score,
        uncertainty_notes: plan.uncertainty_notes,
      })
      .select()
      .single();

    if (processError || !processRow) {
      console.error("[create] process insert failed:", processError);
      return NextResponse.json({ error: "Failed to create process" }, { status: 500 });
    }

    // ── 2. Insert steps + checklist items ────────────────────────────────────
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];

      const { data: stepRow, error: stepError } = await supabase
        .from("process_steps")
        .insert({
          process_id: processRow.id,
          order_index: i,
          title: step.title,
          description: step.description,
          status: i === 0 ? "in_progress" : "not_started",
          estimated_duration: step.estimated_duration ?? null,
          target_date: step.target_date ?? null,
        })
        .select()
        .single();

      if (stepError || !stepRow) {
        console.error("[create] step insert failed:", stepError);
        continue;
      }

      if (step.checklist_items.length > 0) {
        const checklistRows = step.checklist_items.map((item) => ({
          process_step_id: stepRow.id,
          label: item.label,
          completed: false,
          item_type: item.item_type,
          due_date: item.due_date ?? null,
          notes: item.notes ?? null,
        }));

        const { error: clError } = await supabase
          .from("process_checklist_items")
          .insert(checklistRows);

        if (clError) {
          console.error("[create] checklist insert failed:", clError);
        }
      }
    }

    // ── 3. Return the full process with steps ────────────────────────────────
    const { data: fullProcess, error: fetchError } = await supabase
      .from("processes")
      .select(`
        *,
        steps:process_steps (
          *,
          checklist_items:process_checklist_items (*)
        )
      `)
      .eq("id", processRow.id)
      .order("order_index", { foreignTable: "process_steps", ascending: true })
      .single();

    if (fetchError || !fullProcess) {
      console.error("[create] final fetch failed:", fetchError);
      // Process was created — return with empty steps so the client doesn't crash
      return NextResponse.json({ process: { ...processRow, steps: [] } });
    }

    return NextResponse.json({ process: fullProcess });
  } catch (err) {
    console.error("[process-agent/create]", err);
    return NextResponse.json({ error: "Failed to create process" }, { status: 500 });
  }
}
