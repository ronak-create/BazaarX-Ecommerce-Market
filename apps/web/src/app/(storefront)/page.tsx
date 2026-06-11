import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowsCounterClockwise,
  Money,
  Storefront,
} from "@phosphor-icons/react/dist/ssr";
import { prisma, BannerPosition, ProductStatus } from "@bazaarx/db";
import { ProductCard } from "@/components/storefront/product-card";
import { toProductCard } from "@/lib/product-card";

export const dynamic = "force-dynamic";

const TRUST = [
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: Truck, label: "Fast delivery" },
  { icon: ArrowsCounterClockwise, label: "7-day returns" },
  { icon: Money, label: "Cash on delivery" },
];

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
    <div className="space-y-14">
      {/* Hero — asymmetric split, copy left, visual right. One load entrance. */}
      <section className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex animate-fade-up flex-col justify-center overflow-hidden rounded-2xl border border-ink-200 bg-white p-8 sm:p-10 lg:p-12">
          <h1 className="max-w-[14ch] font-display text-4xl font-bold leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
            One marketplace,<br />thousands of sellers.
          </h1>
          <p className="mt-4 max-w-[46ch] text-base leading-relaxed text-ink-600">
            Discover great products at honest prices, with easy returns and cash on delivery across India.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-fg shadow-pop transition hover:bg-brand-800 active:scale-[0.98]"
            >
              Start shopping
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/seller"
              className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-400 hover:bg-ink-50 active:scale-[0.98]"
            >
              <Storefront size={16} />
              Sell on BazaarX
            </Link>
          </div>
        </div>

        <Link
          href={hero?.linkUrl ?? "/search"}
          className="group relative block min-h-[260px] overflow-hidden rounded-2xl border border-ink-200 lg:min-h-0"
        >
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={hero.imageUrl}
              alt=""
              fetchPriority="high"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="relative flex h-full items-center justify-center bg-brand-900 p-10">
              <div className="bg-dotted pointer-events-none absolute inset-0 opacity-15" />
              <div className="relative text-center text-brand-fg">
                <Storefront size={56} weight="duotone" className="mx-auto opacity-90" />
                <p className="mt-4 font-display text-2xl font-semibold">Shop the latest drops</p>
                <p className="mt-1 text-sm text-brand-200">Handpicked from sellers across the country.</p>
              </div>
            </div>
          )}
        </Link>
      </section>

      {/* Trust strip — single hairline-divided row. */}
      <section className="grid grid-cols-2 divide-ink-200 rounded-2xl border border-ink-200 bg-white sm:grid-cols-4 sm:divide-x">
        {TRUST.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
              <Icon size={18} weight="bold" />
            </span>
            <span className="text-sm font-medium text-ink-700">{label}</span>
          </div>
        ))}
      </section>

      {/* Categories. */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink-900">Shop by category</h2>
          <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">
            Browse all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40 sm:flex-col sm:items-start sm:gap-2"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 font-display text-base font-semibold text-brand-700">
                {c.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-ink-700 transition-colors group-hover:text-brand-700">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals. */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink-900">New arrivals</h2>
          <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center">
            <Storefront size={32} className="mx-auto text-ink-300" />
            <p className="mt-3 text-sm text-ink-500">
              No products yet. Sellers can add them from the seller dashboard.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={toProductCard(p)} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
