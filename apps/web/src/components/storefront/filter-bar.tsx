"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Funnel, SortAscending } from "@phosphor-icons/react";

const SORTS: { value: string; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Best rated" },
];

const fieldCls =
  "h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-ink-900 focus:ring-4 focus:ring-ink-900/10";

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
    <div className="flex flex-col gap-4 rounded-2xl border border-ink-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
      {/* Left cluster — filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex h-10 items-center gap-2 self-end rounded-xl bg-ink-900 px-3 text-sm font-semibold text-white">
          <Funnel size={15} weight="fill" />
          Filters
        </div>

        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-ink-500">Min price</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="₹0"
            defaultValue={params.get("minPrice") ?? ""}
            onBlur={(e) => setParam("minPrice", e.target.value)}
            className={`${fieldCls} w-24`}
          />
        </label>

        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-ink-500">Max price</span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Any"
            defaultValue={params.get("maxPrice") ?? ""}
            onBlur={(e) => setParam("maxPrice", e.target.value)}
            className={`${fieldCls} w-24`}
          />
        </label>

        <label className="space-y-1.5">
          <span className="block text-xs font-medium text-ink-500">Min rating</span>
          <select
            defaultValue={params.get("minRating") ?? ""}
            onChange={(e) => setParam("minRating", e.target.value)}
            className={fieldCls}
          >
            <option value="">Any</option>
            <option value="4">4★ &amp; up</option>
            <option value="3">3★ &amp; up</option>
            <option value="2">2★ &amp; up</option>
          </select>
        </label>
      </div>

      {/* Right cluster — sort */}
      <label className="space-y-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
          <SortAscending size={13} weight="bold" /> Sort by
        </span>
        <select
          defaultValue={params.get("sort") ?? "relevance"}
          onChange={(e) => setParam("sort", e.target.value)}
          className={`${fieldCls} w-full sm:w-52`}
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
