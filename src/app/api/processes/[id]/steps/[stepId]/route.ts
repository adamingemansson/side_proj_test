import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, stepId } = await params;
    const body = await req.json();

    // Verify the step belongs to a process owned by this user
    const { data: step, error: fetchError } = await supabase
      .from("process_steps")
      .select("id, process_id")
      .eq("id", stepId)
      .eq("process_id", id)
      .single();

    if (fetchError || !step) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }

    const { data: process } = await supabase
      .from("processes")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!process) {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 });
    }

    const allowed = ["status", "notes", "target_date"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("process_steps")
      .update(updates)
      .eq("id", stepId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ step: data });
  } catch (err) {
    console.error("[steps/PATCH]", err);
    return NextResponse.json({ error: "Failed to update step" }, { status: 500 });
  }
}
