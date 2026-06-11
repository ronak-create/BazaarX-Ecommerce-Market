import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, UserRole } from "@bazaarx/db";
import { slugify } from "@bazaarx/utils";
import { authorizeApi } from "@/lib/auth";
import { apiError, forbidden, unauthorized, validationError } from "@/lib/api";
import type { CategoryNode } from "@bazaarx/types";

const MAX_LEVEL = 3;

type Row = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  level: number;
};

function buildTree(rows: Row[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }));
  const roots: CategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

/** GET /api/categories — full category tree (public). */
export async function GET() {
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, parentId: true, imageUrl: true, level: true },
  });
  return NextResponse.json(buildTree(rows));
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  parentId: z.string().nullish(),
  imageUrl: z.string().url().nullish(),
});

/** POST /api/categories — create a category (admin). Enforces the 3-level cap. */
export async function POST(req: Request) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);
  const { name, parentId, imageUrl } = parsed.data;

  let level = 1;
  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) return apiError("INVALID_PARENT", "Parent category not found", 422);
    if (parent.level >= MAX_LEVEL) {
      return apiError("MAX_DEPTH", `Categories can be at most ${MAX_LEVEL} levels deep`, 422);
    }
    level = parent.level + 1;
  }

  // Keep slugs unique across the tree.
  const base = slugify(name);
  let slug = base;
  for (let i = 2; await prisma.category.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const category = await prisma.category.create({
    data: { name, slug, parentId: parentId ?? null, imageUrl: imageUrl ?? null, level },
  });
  return NextResponse.json(category, { status: 201 });
}
