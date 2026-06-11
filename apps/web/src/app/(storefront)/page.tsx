import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  ArrowsCounterClockwise,
  Money,
  Storefront,
  ShoppingBag,
  TShirt,
  DeviceMobile,
  Sneaker,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { prisma, BannerPosition, ProductStatus } from "@bazaarx/db";
import { ProductCard } from "@/components/storefront/product-card";
import { toProductCard } from "@/lib/product-card";

export const dynamic = "force-dynamic";

const TRUST = [
  { icon: ShieldCheck, label: "Secure checkout", tint: "bg-emerald-50 text-emerald-700" },
  { icon: Truck, label: "Fast delivery", tint: "bg-sky-50 text-sky-700" },
  { icon: ArrowsCounterClockwise, label: "7-day returns", tint: "bg-amber-50 text-amber-700" },
  { icon: Money, label: "Cash on delivery", tint: "bg-brand-50 text-brand-700" },
];

// Soft tints rotated across category tiles for a bit of colour.
const CAT_TINTS = [
  "from-brand-50 to-brand-100 text-brand-700",
  "from-emerald-50 to-emerald-100 text-emerald-700",
  "from-amber-50 to-amber-100 text-amber-700",
  "from-sky-50 to-sky-100 text-sky-700",
  "from-rose-50 to-rose-100 text-rose-600",
  "from-fuchsia-50 to-fuchsia-100 text-fuchsia-700",
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
      {/* Hero — asymmetric split, copy left, colourful collage right. */}
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

        {hero ? (
          <Link
            href={hero.linkUrl ?? "/search"}
            className="group relative block min-h-[260px] overflow-hidden rounded-2xl border border-ink-200 lg:min-h-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero.imageUrl}
              alt=""
              fetchPriority="high"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </Link>
        ) : (
          <Link
            href="/search"
            className="group relative block overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-br from-brand-50 via-white to-sky-50/60 p-4"
          >
            {/* Decorative sparkles. */}
            <Sparkle size={26} weight="fill" className="absolute right-6 top-5 text-amber-300" />
            <Sparkle size={14} weight="fill" className="absolute right-16 top-12 text-amber-200" />

            <div className="grid h-full min-h-[300px] grid-cols-3 grid-rows-3 gap-3">
              <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-2xl bg-brand p-5 text-brand-fg shadow-pop">
                <ShoppingBag size={34} weight="fill" />
                <div>
                  <div className="font-display text-xl font-bold leading-tight">Shop the latest drops</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-sm text-brand-100 transition-transform group-hover:translate-x-0.5">
                    Browse all <ArrowRight size={14} weight="bold" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Sparkle size={26} weight="fill" />
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <TShirt size={28} weight="fill" />
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <DeviceMobile size={26} weight="fill" />
              </div>
              <div className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-rose-100 text-rose-600">
                <Sneaker size={26} weight="fill" />
                <span className="font-display text-sm font-semibold">Fashion · Tech · Home &amp; more</span>
              </div>
            </div>
          </Link>
        )}
      </section>

      {/* Trust strip — colour-coded utility row. */}
      <section className="grid grid-cols-2 divide-ink-200 rounded-2xl border border-ink-200 bg-white sm:grid-cols-4 sm:divide-x">
        {TRUST.map(({ icon: Icon, label, tint }) => (
          <div key={label} className="flex items-center gap-3 px-5 py-4">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tint}`}>
              <Icon size={18} weight="bold" />
            </span>
            <span className="text-sm font-medium text-ink-700">{label}</span>
          </div>
        ))}
      </section>

      {/* Categories — each tile gets a rotating tint. */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink-900">Shop by category</h2>
          <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">
            Browse all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => {
            const tint = CAT_TINTS[i % CAT_TINTS.length];
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40 sm:flex-col sm:items-start sm:gap-2"
              >
                <span className={`grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br font-display text-base font-semibold ${tint}`}>
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-medium text-ink-700 transition-colors group-hover:text-brand-700">
                  {c.name}
                </span>
              </Link>
            );
          })}
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
