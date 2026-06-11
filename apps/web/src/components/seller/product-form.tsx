"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@bazaarx/ui";
import { useCategories, flattenCategories } from "@/hooks/use-categories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { VariantEditor } from "./variant-editor";
import { ImageUploader } from "./image-uploader";
import type { ImageInput, ProductDTO, ProductInput, VariantInput } from "@bazaarx/types";

type Props = { initial?: ProductDTO };

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

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Base price</label>
          <input
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="499.00"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Brand</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <ImageUploader value={images} onChange={setImages} />
      <VariantEditor value={variants} onChange={setVariants} />

      <div className="space-y-1">
        <label className="text-sm font-medium">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ProductInput["status"])}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? "Saving…" : initial ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/seller/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
