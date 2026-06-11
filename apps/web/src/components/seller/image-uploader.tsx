"use client";

import { useState } from "react";
import { Star, X, WarningCircle } from "@phosphor-icons/react";
import { uploadPublicImage } from "@/hooks/use-upload";
import type { ImageInput } from "@bazaarx/types";

const MAX_IMAGES = 8;

const fileCls =
  "block w-full text-sm text-ink-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-50";

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
    <div className="space-y-3">
      <input
        type="file"
        multiple
        accept="image/*"
        disabled={busy || value.length >= MAX_IMAGES}
        onChange={(e) => handleFiles(e.target.files)}
        className={fileCls}
      />
      <p className="text-xs text-ink-400">Up to {MAX_IMAGES} images. The starred image is the cover.</p>
      {busy && <p className="text-sm text-ink-500">Uploading…</p>}
      {error && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          <WarningCircle size={15} weight="fill" /> {error}
        </p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((img) => (
              <div
                key={img.url}
                className={`group relative overflow-hidden rounded-xl border-2 bg-white ${
                  img.isPrimary ? "border-brand-500 ring-2 ring-brand-100" : "border-ink-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-24 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => remove(img.url)}
                  aria-label="Remove image"
                  className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ink-900/70 text-white opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
                >
                  <X size={13} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setPrimary(img.url)}
                  className={`flex w-full items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors ${
                    img.isPrimary ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-ink-50"
                  }`}
                >
                  <Star size={12} weight={img.isPrimary ? "fill" : "regular"} />
                  {img.isPrimary ? "Cover" : "Set cover"}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
