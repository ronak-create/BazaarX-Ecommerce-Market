"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UploadSimple, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import type { BulkUploadResult } from "@bazaarx/types";

/**
 * Bulk product import from a CSV. Reads the file client-side and posts its text
 * to the bulk API. Expected columns:
 *   name, description, categorySlug, basePrice, sku, stock
 *   (optional: discountedPrice, brand, price, status)
 */
export function BulkUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const csv = await file.text();
      const res = await fetch("/api/seller/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed");
      setResult(json);
      qc.invalidateQueries({ queryKey: ["seller", "products"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <button
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-400 hover:bg-ink-50 disabled:opacity-50"
      >
        <UploadSimple size={16} weight="bold" /> {busy ? "Importing…" : "Bulk CSV"}
      </button>

      {(result || error) && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl border border-ink-200 bg-white p-4 text-sm shadow-pop">
          {error && (
            <p className="inline-flex items-center gap-1.5 font-medium text-accent">
              <WarningCircle size={15} weight="fill" /> {error}
            </p>
          )}
          {result && (
            <div className="space-y-1.5">
              <p className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                <CheckCircle size={15} weight="fill" /> {result.created} created
              </p>
              {result.failed > 0 && <p className="font-medium text-accent">{result.failed} failed</p>}
              {result.errors.slice(0, 5).map((e) => (
                <p key={e.row} className="text-xs text-ink-500">
                  Row {e.row}: {e.message}
                </p>
              ))}
              <button onClick={() => setResult(null)} className="mt-1 text-xs font-medium text-ink-400 hover:text-ink-600">
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
