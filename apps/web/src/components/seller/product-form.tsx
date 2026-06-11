"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WarningCircle } from "@phosphor-icons/react";
import { useCategories, flattenCategories } from "@/hooks/use-categories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { VariantEditor } from "./variant-editor";
import { ImageUploader } from "./image-uploader";
import type { ImageInput, ProductDTO, ProductInput, VariantInput } from "@bazaarx/types";

type Props = { initial?: ProductDTO };

const inputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100";
const labelCls = "block text-sm font-medium text-ink-700";

export function ProductForm({ initial }: Props) {
  const router = useRouter();
  const { data: tree } = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct(initial?.id ?? "");
  const mutation = initial ? update : create;

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [basePrice, setBasePrice] = useState(initial?.basePrice ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [status, setStatus] = useState<ProductInput["status"]>(
    (initial?.status as ProductInput["status"]) ?? "DRAFT",
  );
  const [variants, setVariants] = useState<VariantInput[]>(
    initial?.variants.map((v) => ({
      id: v.id,
      label: v.label,
      attributes: v.attributes,
      price: v.price,
      stock: v.stock,
      sku: v.sku,
    })) ?? [{ label: "Default", attributes: {}, price: "", stock: 0, sku: "" }],
  );
  const [images, setImages] = useState<ImageInput[]>(
    initial?.images.map((i) => ({
      url: i.url,
      altText: i.altText ?? undefined,
      position: i.position,
      isPrimary: i.isPrimary,
    })) ?? [],
  );

  const options = tree ? flattenCategories(tree) : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload: ProductInput = {
      categoryId,
      name: name.trim(),
      description: description.trim(),
      basePrice: basePrice.trim(),
      brand: brand.trim() || null,
      status,
      variants,
      images,
    };
    mutation.mutate(payload as ProductInput & Partial<ProductInput>, {
      onSuccess: () => router.push("/seller/products"),
    });
  }

  const canSubmit =
    name.trim().length >= 2 &&
    description.trim().length >= 1 &&
    categoryId &&
    /^\d+(\.\d{1,2})?$/.test(basePrice.trim()) &&
    variants.every((v) => v.label && v.sku && /^\d+(\.\d{1,2})?$/.test(v.price));

  const card = "rounded-2xl border border-ink-200 bg-white p-5 sm:p-6";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className={`${card} space-y-5`}>
        <h2 className="font-display text-base font-semibold text-ink-900">Details</h2>

        <div className="space-y-1.5">
          <label className={labelCls}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Cotton crew-neck t-shirt" />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputCls}
            placeholder="What makes this product worth buying?"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className={labelCls}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Base price (₹)</label>
            <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="499.00" className={`${inputCls} tabular-nums`} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Brand</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputCls} placeholder="Optional" />
          </div>
        </div>
      </div>

      <div className={card}>
        <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Images</h2>
        <ImageUploader value={images} onChange={setImages} />
      </div>

      <div className={card}>
        <h2 className="mb-4 font-display text-base font-semibold text-ink-900">Variants</h2>
        <VariantEditor value={variants} onChange={setVariants} />
      </div>

      <div className={`${card} flex flex-wrap items-end justify-between gap-4`}>
        <div className="space-y-1.5">
          <label className={labelCls}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductInput["status"])}
            className={`${inputCls} w-auto`}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
          </select>
          <p className="text-xs text-ink-400">Only Active products show in the store.</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/seller/products")}
            className="rounded-full border border-ink-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-400 hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? "Saving…" : initial ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>

      {mutation.isError && (
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-accent">
          <WarningCircle size={16} weight="fill" /> {(mutation.error as Error).message}
        </p>
      )}
    </form>
  );
}
