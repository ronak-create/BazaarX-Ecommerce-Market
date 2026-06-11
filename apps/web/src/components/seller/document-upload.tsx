"use client";

import { useState } from "react";
import { Button } from "@bazaarx/ui";
import { uploadFile } from "@/hooks/use-upload";

/**
 * Uploads KYC documents to Supabase Storage and surfaces the stored paths
 * to the parent form via onChange. Each upload is signed server-side first.
 */
export function DocumentUpload({
  value,
  onChange,
}: {
  value: string[];
  onChange: (paths: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        paths.push(await uploadFile(file, "kyc"));
      }
      onChange([...value, ...paths]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">KYC documents</label>
      <input
        type="file"
        multiple
        accept="image/*,application/pdf"
        disabled={busy}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
      />
      {busy && <p className="text-sm text-slate-500">Uploading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {value.length > 0 && (
        <ul className="space-y-1 text-sm">
          {value.map((p) => (
            <li key={p} className="flex items-center justify-between rounded border border-slate-200 px-2 py-1">
              <span className="truncate">{p.split("/").pop()}</span>
              <Button
                type="button"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => onChange(value.filter((x) => x !== p))}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
