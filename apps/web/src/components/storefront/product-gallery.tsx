"use client";

import { useState } from "react";
import type { ProductImageDTO } from "@bazaarx/types";

export function ProductGallery({ images, name }: { images: ProductImageDTO[]; name: string }) {
  const ordered = [...images].sort((a, b) => a.position - b.position);
  const [active, setActive] = useState(
    ordered.find((i) => i.isPrimary)?.url ?? ordered[0]?.url ?? null,
  );

  if (!active) {
    return <div className="flex aspect-square items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">No image</div>;
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-lg border border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={active} alt={name} className="h-full w-full object-cover" />
      </div>
      {ordered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {ordered.map((img) => (
            <button
              key={img.id}
              onClick={() => setActive(img.url)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded border ${
                active === img.url ? "border-brand" : "border-slate-200"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
