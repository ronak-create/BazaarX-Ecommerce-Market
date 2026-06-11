"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const SORTS: { value: string; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Best rated" },
];

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
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 p-4">
      <div className="space-y-1">
        <label className="block text-xs text-slate-500">Min price</label>
        <input
          type="number"
          defaultValue={params.get("minPrice") ?? ""}
          onBlur={(e) => setParam("minPrice", e.target.value)}
          className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs text-slate-500">Max price</label>
        <input
          type="number"
          defaultValue={params.get("maxPrice") ?? ""}
          onBlur={(e) => setParam("maxPrice", e.target.value)}
          className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-xs text-slate-500">Min rating</label>
        <select
          defaultValue={params.get("minRating") ?? ""}
          onChange={(e) => setParam("minRating", e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">Any</option>
          <option value="4">4★ & up</option>
          <option value="3">3★ & up</option>
          <option value="2">2★ & up</option>
        </select>
      </div>
      <div className="ml-auto space-y-1">
        <label className="block text-xs text-slate-500">Sort</label>
        <select
          defaultValue={params.get("sort") ?? "relevance"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
