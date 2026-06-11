"use client";

import { createClient } from "@/lib/supabase/client";
import type { UploadBucket, UploadSignResult } from "@bazaarx/types";

/**
 * Signs and uploads a single file to Supabase Storage, returning its path.
 * Flow: ask the server for a signed upload URL, then upload directly from the
 * browser using the returned token (keeps the file off our API server).
 */
export async function uploadFile(file: File, bucket: UploadBucket): Promise<string> {
  const res = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, fileName: file.name, contentType: file.type }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Failed to sign upload");
  }
  const { path, token } = (await res.json()) as UploadSignResult;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file);
  if (error) throw new Error(error.message);

  return path;
}
