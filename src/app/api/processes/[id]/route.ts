import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from("processes")
      .select(`
        *,
        steps:process_steps (
          *,
          checklist_items:process_checklist_items (*)
        )
      `)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .order("order_index", { foreignTable: "process_steps", ascending: true })
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Process not found" }, { status: 404 });
    }

    return NextResponse.json({ process: data });
  } catch (err) {
    console.error("[processes/[id]/GET]", err);
    return NextResponse.json({ error: "Failed to load process" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const allowed = ["status", "next_action", "next_deadline", "notes"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("processes")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ process: data });
  } catch (err) {
    console.error("[processes/[id]/PATCH]", err);
    return NextResponse.json({ error: "Failed to update process" }, { status: 500 });
  }
}
