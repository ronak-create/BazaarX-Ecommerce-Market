"use client";

import { useState } from "react";
import { Image } from "@phosphor-icons/react";
import type { ProductImageDTO } from "@bazaarx/types";

export function ProductGallery({ images, name }: { images: ProductImageDTO[]; name: string }) {
  const ordered = [...images].sort((a, b) => a.position - b.position);
  const [active, setActive] = useState(
    ordered.find((i) => i.isPrimary)?.url ?? ordered[0]?.url ?? null,
  );

  if (!active) {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-ink-100 text-ink-300">
        <Image size={36} />
        <span className="text-sm">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:sticky lg:top-28">
      <div className="group aspect-square overflow-hidden rounded-2xl border border-ink-200 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
      {ordered.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {ordered.map((img) => (
            <button
              key={img.id}
              onClick={() => setActive(img.url)}
              aria-label="View image"
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                active === img.url
                  ? "border-brand-600 ring-2 ring-brand-100"
                  : "border-ink-200 hover:border-ink-300"
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
