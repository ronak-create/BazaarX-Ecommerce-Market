"use client";

import { useState } from "react";
import { uploadPublicImage } from "@/hooks/use-upload";
import type { ImageInput } from "@bazaarx/types";

const MAX_IMAGES = 8;

/**
 * Uploads product images to the public `products` bucket and manages ordering
 * and the primary flag. Surfaces ImageInput[] to the parent form.
 */
export function ImageUploader({
  value,
  onChange,
}: {
  value: ImageInput[];
  onChange: (images: ImageInput[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_IMAGES - value.length;
    if (room <= 0) {
      setError(`Up to ${MAX_IMAGES} images.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = [...value];
      for (const file of Array.from(files).slice(0, room)) {
        const { url } = await uploadPublicImage(file, "products");
        next.push({
          url,
          position: next.length,
          isPrimary: next.length === 0, // first image is primary by default
        });
      }
      onChange(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function remove(url: string) {
    const next = value
      .filter((i) => i.url !== url)
      .map((i, idx) => ({ ...i, position: idx }));
    if (next.length > 0 && !next.some((i) => i.isPrimary)) next[0]!.isPrimary = true;
    onChange(next);
  }

  function setPrimary(url: string) {
    onChange(value.map((i) => ({ ...i, isPrimary: i.url === url })));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Images (up to {MAX_IMAGES})</label>
      <input
        type="file"
        multiple
        accept="image/*"
        disabled={busy || value.length >= MAX_IMAGES}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
      />
      {busy && <p className="text-sm text-slate-500">Uploading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {value
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((img) => (
              <div key={img.url} className="relative rounded border border-slate-200 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-20 w-full rounded object-cover" />
                <div className="mt-1 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setPrimary(img.url)}
                    className={img.isPrimary ? "font-medium text-brand" : "text-slate-500"}
                  >
                    {img.isPrimary ? "Primary" : "Set primary"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(img.url)}
                    className="text-red-500"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
