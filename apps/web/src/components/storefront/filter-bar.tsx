"use client";

/* Hallmark · component: filter-bar · genre: modern-minimal · system: BazaarX tokens
 * pre-emit critique: P4 H4 E4 S4 R5 V4 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Funnel } from "@phosphor-icons/react";

const SORTS: { value: string; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Best rated" },
];

const inputCls =
  "rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

/** Price / rating / sort controls that drive the listing via URL query params. */
export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-ink-200 bg-white p-4">
      <div className="flex items-center gap-2 self-center pr-1 text-sm font-medium text-ink-700">
        <Funnel size={16} weight="bold" className="text-brand-700" />
        Filters
      </div>

      <label className="space-y-1.5">
        <span className="block text-xs font-medium text-ink-500">Min price</span>
        <input
          type="number"
          inputMode="numeric"
          defaultValue={params.get("minPrice") ?? ""}
          onBlur={(e) => setParam("minPrice", e.target.value)}
          className={`${inputCls} w-24`}
        />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-medium text-ink-500">Max price</span>
        <input
          type="number"
          inputMode="numeric"
          defaultValue={params.get("maxPrice") ?? ""}
          onBlur={(e) => setParam("maxPrice", e.target.value)}
          className={`${inputCls} w-24`}
        />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-medium text-ink-500">Min rating</span>
        <select
          defaultValue={params.get("minRating") ?? ""}
          onChange={(e) => setParam("minRating", e.target.value)}
          className={inputCls}
        >
          <option value="">Any</option>
          <option value="4">4★ &amp; up</option>
          <option value="3">3★ &amp; up</option>
          <option value="2">2★ &amp; up</option>
        </select>
      </label>

      <label className="ml-auto space-y-1.5">
        <span className="block text-xs font-medium text-ink-500">Sort</span>
        <select
          defaultValue={params.get("sort") ?? "relevance"}
          onChange={(e) => setParam("sort", e.target.value)}
          className={inputCls}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
