"use client";

import { Button } from "@bazaarx/ui";
import type { VariantInput } from "@bazaarx/types";

const blank = (): VariantInput => ({ label: "", attributes: {}, price: "", stock: 0, sku: "" });

/**
 * Edits the list of product variants. Each variant has a label, price, stock,
 * SKU, and free-form attributes entered as "key:value, key:value".
 */
export function VariantEditor({
  value,
  onChange,
}: {
  value: VariantInput[];
  onChange: (variants: VariantInput[]) => void;
}) {
  function update(i: number, patch: Partial<VariantInput>) {
    onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  function attrsToText(a: Record<string, string>) {
    return Object.entries(a)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");
  }
  function textToAttrs(t: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const pair of t.split(",")) {
      const [k, ...rest] = pair.split(":");
      if (k && k.trim() && rest.length) out[k.trim()] = rest.join(":").trim();
    }
    return out;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Variants</label>
        <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => onChange([...value, blank()])}>
          + Add variant
        </Button>
      </div>

      {value.map((v, i) => (
        <div key={i} className="space-y-2 rounded-md border border-slate-200 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              placeholder="Label (e.g. Red / XL)"
              value={v.label}
              onChange={(e) => update(i, { label: e.target.value })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="SKU"
              value={v.sku}
              onChange={(e) => update(i, { sku: e.target.value })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              placeholder="Price (e.g. 499.00)"
              value={v.price}
              onChange={(e) => update(i, { price: e.target.value })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="Stock"
              value={v.stock}
              onChange={(e) => update(i, { stock: Number(e.target.value) })}
              className="rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <input
            placeholder="Attributes: color:Red, size:XL"
            defaultValue={attrsToText(v.attributes)}
            onBlur={(e) => update(i, { attributes: textToAttrs(e.target.value) })}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          {value.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="text-xs text-red-500 hover:underline"
            >
              Remove variant
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
