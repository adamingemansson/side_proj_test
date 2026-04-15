import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/db";
import { DEMO_PROCESSES } from "@/lib/data/processes";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Demo user — return static fixtures directly (no DB involved)
    if (session.user.id === "demo") {
      return NextResponse.json({ processes: DEMO_PROCESSES, isDemo: true });
    }

    const { data, error } = await supabase
      .from("processes")
      .select(`
        *,
        steps:process_steps (
          *,
          checklist_items:process_checklist_items (*)
        )
      `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .order("order_index", { foreignTable: "process_steps", ascending: true });

    if (error) throw error;

    return NextResponse.json({ processes: data ?? [] });
  } catch (err) {
    console.error("[processes/GET]", err);
    return NextResponse.json({ error: "Failed to load processes" }, { status: 500 });
  }
}
