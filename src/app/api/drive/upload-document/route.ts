import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { supabase } from "@/lib/db";
import { ensureChildFolder, uploadFileToDrive } from "@/lib/drive";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === "demo") {
      return NextResponse.json({ error: "Not available in demo mode" }, { status: 403 });
    }

    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: "No Drive access token" }, { status: 401 });
    }

    // Get the user's root migraDOCS folder ID from the DB
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("drive_folder_id")
      .eq("id", session.user.id)
      .single();

    if (userErr || !user?.drive_folder_id) {
      return NextResponse.json({ error: "Drive folder not set up yet" }, { status: 400 });
    }

    // Parse the uploaded file from FormData
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure the "Uploaded Documents" subfolder exists
    const uploadsFolderId = await ensureChildFolder(
      accessToken,
      user.drive_folder_id,
      "Uploaded Documents"
    );

    // Upload the file
    const fileBuffer = await file.arrayBuffer();
    const driveFileId = await uploadFileToDrive(
      accessToken,
      uploadsFolderId,
      fileBuffer,
      file.name,
      file.type
    );

    return NextResponse.json({ driveFileId, folderId: uploadsFolderId });
  } catch (err) {
    console.error("[drive/upload-document]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
