import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/db";
import type { DocumentRow } from "@/lib/db";
import { DEMO_DOCUMENTS } from "@/lib/data/documents";
import type { Document } from "@/types";

function rowToDocument(row: DocumentRow): Document {
  const isImage = row.file_type.startsWith("image/");
  return {
    id: row.id,
    title: row.file_name,
    issuingAuthority: "",
    dateReceived: row.uploaded_at.split("T")[0],
    category: "other",
    status: "pending_review",
    confidence: "low",
    confidenceScore: 0,
    summary: "Run analysis in the Analyse Document tab to extract details.",
    requiredActions: [],
    preparationChecklist: [],
    fileType: isImage ? "image" : "pdf",
    tags: [],
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Demo user — return static fixtures directly
    if (session.user.id === "demo") {
      return NextResponse.json({ documents: DEMO_DOCUMENTS });
    }

    const { data, error } = await supabase
      .from("documents")
      .select("id, user_id, drive_file_id, file_name, file_type, uploaded_at")
      .eq("user_id", session.user.id)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    const documents: Document[] = (data ?? [] as DocumentRow[]).map(rowToDocument);
    return NextResponse.json({ documents });
  } catch (err) {
    console.error("[documents/GET]", err);
    return NextResponse.json(
      { error: "Failed to load documents" },
      { status: 500 }
    );
  }
}
