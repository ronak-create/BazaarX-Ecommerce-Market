import Link from "next/link";
import { prisma, BannerPosition, ProductStatus } from "@bazaarx/db";
import { ProductCard } from "@/components/storefront/product-card";
import { toProductCard } from "@/lib/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, categories, products] = await Promise.all([
    prisma.banner.findMany({
      where: { position: BannerPosition.HOME, isActive: true },
      orderBy: { priority: "desc" },
    }),
    prisma.category.findMany({ where: { level: 1 }, orderBy: { name: "asc" }, take: 12 }),
    prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { images: true, variants: { select: { stock: true } } },
    }),
  ]);

  const hero = banners[0];

  return (
    <div className="space-y-10">
      {hero && (
        <Link href={hero.linkUrl ?? "/search"} className="block overflow-hidden rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero.imageUrl} alt="" className="h-48 w-full object-cover sm:h-64" />
        </Link>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Shop by category</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="rounded-lg border border-slate-200 p-4 text-center text-sm hover:border-brand hover:text-brand"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">New arrivals</h2>
        {products.length === 0 ? (
          <p className="text-sm text-slate-500">
            No products yet. Sellers can add them from the seller dashboard.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={toProductCard(p)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
