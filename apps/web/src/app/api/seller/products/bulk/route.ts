import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, ProductStatus } from "@bazaarx/db";
import { slugify } from "@bazaarx/utils";
import { authorizeApprovedSeller } from "@/lib/auth";
import { apiError, forbidden, unauthorized } from "@/lib/api";
import type { BulkUploadResult } from "@bazaarx/types";

/**
 * Minimal CSV parser handling quoted fields and embedded commas/newlines.
 * Returns an array of rows, each an array of cell strings.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

const rowSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(1),
  categorySlug: z.string().trim().min(1),
  basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  discountedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  brand: z.string().trim().optional(),
  sku: z.string().trim().min(1),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  stock: z.string().regex(/^\d+$/),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
});

const REQUIRED = ["name", "description", "categoryslug", "baseprice", "sku", "stock"];

/**
 * POST /api/seller/products/bulk
 * Body: { csv: string }. One product per row with a single default variant.
 */
export async function POST(req: Request) {
  const auth = await authorizeApprovedSeller();
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden("Approved seller account required");

  let body: { csv?: string };
  try {
    body = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  if (!body.csv?.trim()) return apiError("VALIDATION", "csv is required", 422);

  const rows = parseCsv(body.csv);
  if (rows.length < 2) return apiError("VALIDATION", "CSV needs a header and at least one row", 422);

  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  for (const req of REQUIRED) {
    if (!header.includes(req)) return apiError("VALIDATION", `Missing column: ${req}`, 422);
  }

  // Cache category lookups by slug.
  const categoryCache = new Map<string, string | null>();
  async function categoryIdForSlug(slug: string): Promise<string | null> {
    if (categoryCache.has(slug)) return categoryCache.get(slug)!;
    const cat = await prisma.category.findUnique({ where: { slug } });
    categoryCache.set(slug, cat?.id ?? null);
    return cat?.id ?? null;
  }

  const result: BulkUploadResult = { created: 0, failed: 0, errors: [] };

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]!;
    const record: Record<string, string> = {};
    header.forEach((h, idx) => (record[h] = (cells[idx] ?? "").trim()));

    const parsed = rowSchema.safeParse({
      name: record.name,
      description: record.description,
      categorySlug: record.categoryslug,
      basePrice: record.baseprice,
      discountedPrice: record.discountedprice || undefined,
      brand: record.brand || undefined,
      sku: record.sku,
      price: record.price || undefined,
      stock: record.stock,
      status: (record.status || "").toUpperCase() || undefined,
    });
    if (!parsed.success) {
      result.failed++;
      result.errors.push({ row: r + 1, message: parsed.error.issues[0]?.message ?? "Invalid row" });
      continue;
    }
    const data = parsed.data;

    const categoryId = await categoryIdForSlug(data.categorySlug);
    if (!categoryId) {
      result.failed++;
      result.errors.push({ row: r + 1, message: `Unknown category: ${data.categorySlug}` });
      continue;
    }

    // Unique slug per product.
    const base = slugify(data.name) || "product";
    let slug = base;
    for (let i = 2; await prisma.product.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

    try {
      await prisma.product.create({
        data: {
          sellerId: auth.seller.id,
          categoryId,
          name: data.name,
          slug,
          description: data.description,
          basePrice: data.basePrice,
          discountedPrice: data.discountedPrice ?? null,
          brand: data.brand ?? null,
          status: (data.status as ProductStatus | undefined) ?? ProductStatus.ACTIVE,
          variants: {
            create: {
              label: "Default",
              attributes: {},
              price: data.price ?? data.basePrice,
              stock: Number(data.stock),
              sku: data.sku,
            },
          },
        },
      });
      result.created++;
    } catch (e) {
      result.failed++;
      const dup = e instanceof Object && "code" in e && (e as { code: string }).code === "P2002";
      result.errors.push({ row: r + 1, message: dup ? `Duplicate SKU: ${data.sku}` : "Create failed" });
    }
  }

  return NextResponse.json(result);
}
