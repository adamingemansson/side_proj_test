/** Google Drive REST API helpers.
 *  All calls are made on behalf of the user using their own access token.
 *  migraDOCS never touches files it didn't create (drive.file scope).
 */

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";

// ── Folder ─────────────────────────────────────────────────────────────────

/** Creates a folder in the user's Google Drive. Returns the new folder ID. */
export async function createDriveFolder(
  accessToken: string,
  folderName: string
): Promise<string> {
  const res = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Drive folder creation failed (${res.status}): ${JSON.stringify(body)}`);
  }

  const data = await res.json();
  return data.id as string;
}

// ── Folder helpers ─────────────────────────────────────────────────────────

/** Searches for a folder by name inside `parentId`. Returns its ID or null. */
export async function findChildFolder(
  accessToken: string,
  parentId: string,
  name: string
): Promise<string | null> {
  const q = encodeURIComponent(
    `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
  );
  const res = await fetch(`${DRIVE_API}/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.files as { id: string }[])?.[0]?.id ?? null;
}

/** Ensures a folder named `name` exists inside `parentId`. Returns its ID. */
export async function ensureChildFolder(
  accessToken: string,
  parentId: string,
  name: string
): Promise<string> {
  const existing = await findChildFolder(accessToken, parentId, name);
  if (existing) return existing;

  const res = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Drive folder creation failed (${res.status}): ${JSON.stringify(body)}`);
  }

  const data = await res.json();
  return data.id as string;
}

// ── Upload ─────────────────────────────────────────────────────────────────

/** Uploads a file to the user's migraDOCS Drive folder using multipart upload.
 *  Returns the Drive file ID. */
export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileBuffer: ArrayBuffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const boundary = `migradocs_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });

  // Build a multipart/related body:
  // --boundary
  // Content-Type: application/json
  //
  // {metadata}
  // --boundary
  // Content-Type: {mimeType}
  //
  // {binary data}
  // --boundary--
  const enc = new TextEncoder();
  const metaPart = enc.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
  );
  const fileHeader = enc.encode(
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  );
  const closing = enc.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(
    metaPart.byteLength + fileHeader.byteLength + fileBuffer.byteLength + closing.byteLength
  );
  let offset = 0;
  body.set(metaPart, offset); offset += metaPart.byteLength;
  body.set(fileHeader, offset); offset += fileHeader.byteLength;
  body.set(new Uint8Array(fileBuffer), offset); offset += fileBuffer.byteLength;
  body.set(closing, offset);

  const res = await fetch(
    `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(`Drive upload failed (${res.status}): ${JSON.stringify(errBody)}`);
  }

  const data = await res.json();
  return data.id as string;
}

// ── Delete ─────────────────────────────────────────────────────────────────

/** Permanently deletes a file from the user's Google Drive.
 *  Treats 404 as a no-op (already deleted). */
export async function deleteFromDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 204 = success, 404 = already gone — both are fine
  if (res.ok || res.status === 404 || res.status === 204) return;

  const errBody = await res.json().catch(() => ({}));
  throw new Error(`Drive delete failed (${res.status}): ${JSON.stringify(errBody)}`);
}

// ── Drive preview URL ──────────────────────────────────────────────────────

/** Returns the Google Drive embeddable preview URL for a file. */
export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
}
