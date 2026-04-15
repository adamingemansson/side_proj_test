import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, itemId } = await params;
    const body = await req.json();

    // Verify ownership chain: item → step → process → user
    const { data: item, error: itemError } = await supabase
      .from("process_checklist_items")
      .select("id, process_step_id")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { data: step } = await supabase
      .from("process_steps")
      .select("id, process_id")
      .eq("id", item.process_step_id)
      .eq("process_id", id)
      .single();

    if (!step) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
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

    const allowed = ["completed", "notes", "due_date"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("process_checklist_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (err) {
    console.error("[checklist/PATCH]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
