"use client";

import { useState } from "react";
import { FileText, Trash, WarningCircle } from "@phosphor-icons/react";
import { uploadFile } from "@/hooks/use-upload";

const fileCls =
  "block w-full text-sm text-ink-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-50";

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
      <label className="block text-sm font-medium text-ink-700">KYC documents</label>
      <input
        type="file"
        multiple
        accept="image/*,application/pdf"
        disabled={busy}
        onChange={(e) => handleFiles(e.target.files)}
        className={fileCls}
      />
      {busy && <p className="text-sm text-ink-500">Uploading…</p>}
      {error && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          <WarningCircle size={15} weight="fill" /> {error}
        </p>
      )}
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((p) => (
            <li key={p} className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm">
              <FileText size={18} className="shrink-0 text-ink-400" />
              <span className="min-w-0 flex-1 truncate text-ink-700">{p.split("/").pop()}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== p))}
                aria-label="Remove document"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-accent/10 hover:text-accent"
              >
                <Trash size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
