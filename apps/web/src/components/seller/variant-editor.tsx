"use client";

import { Plus, Trash } from "@phosphor-icons/react";
import type { VariantInput } from "@bazaarx/types";

const blank = (): VariantInput => ({ label: "", attributes: {}, price: "", stock: 0, sku: "" });

const cellCls =
  "rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

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
      {value.map((v, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-ink-200 bg-ink-50/60 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input placeholder="Label (e.g. Red / XL)" value={v.label} onChange={(e) => update(i, { label: e.target.value })} className={cellCls} />
            <input placeholder="SKU" value={v.sku} onChange={(e) => update(i, { sku: e.target.value })} className={cellCls} />
            <input placeholder="Price (e.g. 499.00)" value={v.price} onChange={(e) => update(i, { price: e.target.value })} className={`${cellCls} tabular-nums`} />
            <input
              type="number"
              placeholder="Stock"
              value={v.stock}
              onChange={(e) => update(i, { stock: Number(e.target.value) })}
              className={`${cellCls} tabular-nums`}
            />
          </div>
          <input
            placeholder="Attributes: color:Red, size:XL"
            defaultValue={attrsToText(v.attributes)}
            onBlur={(e) => update(i, { attributes: textToAttrs(e.target.value) })}
            className={`${cellCls} w-full`}
          />
          {value.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-400 transition-colors hover:text-accent"
            >
              <Trash size={13} /> Remove variant
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...value, blank()])}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-400 hover:bg-ink-50"
      >
        <Plus size={15} weight="bold" /> Add variant
      </button>
    </div>
  );
}
