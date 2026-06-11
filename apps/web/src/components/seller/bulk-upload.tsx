"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@bazaarx/ui";
import type { BulkUploadResult } from "@bazaarx/types";

/**
 * Bulk product import from a CSV. Reads the file client-side and posts its text
 * to the bulk API. Expected columns:
 *   name, description, categorySlug, basePrice, sku, stock
 *   (optional: discountedPrice, brand, price)
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
      <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Importing…" : "Bulk CSV"}
      </Button>

      {(result || error) && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg">
          {error && <p className="text-red-600">{error}</p>}
          {result && (
            <div className="space-y-1">
              <p className="font-medium text-green-700">{result.created} created</p>
              {result.failed > 0 && <p className="text-red-600">{result.failed} failed</p>}
              {result.errors.slice(0, 5).map((e) => (
                <p key={e.row} className="text-xs text-slate-500">
                  Row {e.row}: {e.message}
                </p>
              ))}
              <button onClick={() => setResult(null)} className="mt-1 text-xs text-slate-400 hover:underline">
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
