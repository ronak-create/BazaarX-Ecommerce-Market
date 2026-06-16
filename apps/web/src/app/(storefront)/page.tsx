import Link from "next/link";
import {
  ArrowRight,
  Storefront,
  ShoppingBag,
  TShirt,
  DeviceMobile,
  Sneaker,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { prisma, BannerPosition, ProductStatus } from "@bazaarx/db";
import { ProductCard } from "@/components/storefront/product-card";
import { HeroSlider, type HeroSlide } from "@/components/storefront/hero-slider";
import { CouponBanner } from "@/components/storefront/coupon-banner";
import { toProductCard } from "@/lib/product-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, products] = await Promise.all([
    prisma.banner.findMany({
      where: { position: BannerPosition.HOME, isActive: true },
      orderBy: { priority: "desc" },
    }),
    prisma.product.findMany({
      where: { status: ProductStatus.ACTIVE, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { images: true, variants: { select: { stock: true } } },
    }),
  ]);

  // Hero slides come from HOME banners; if there are fewer than two, pad with
  // recent product imagery so the auto-slider always has something to rotate.
  const bannerSlides: HeroSlide[] = banners.map((b) => ({ src: b.imageUrl, href: b.linkUrl ?? "/search" }));
  const productSlides: HeroSlide[] =
    bannerSlides.length < 2
      ? products
          .map((p) => (p.images.find((i) => i.isPrimary) ?? p.images[0])?.url)
          .filter((u): u is string => Boolean(u))
          .slice(0, 4)
          .map((src) => ({ src, href: "/search" }))
      : [];
  const heroSlides: HeroSlide[] = [...bannerSlides, ...productSlides].slice(0, 5);

  return (
    <div className="space-y-16">
      {/* Hero — full-bleed: figure | editorial headline | motion media. */}
      <section className="relative left-1/2 grid w-screen -translate-x-1/2 items-stretch gap-5 px-5 sm:px-8 lg:grid-cols-[0.55fr_1.05fr_0.95fr] lg:px-14">
        {/* Cut-out shopper, grounded at the bottom — large screens only. */}
        <div className="relative hidden lg:block">
          {/* Soft contact shadow so he doesn't look like he's floating. */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-1 left-1/2 h-5 w-1/2 -translate-x-1/2 rounded-[50%] bg-ink-900/25 blur-md"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-figure.png"
            alt="A shopper browsing the marketplace on their phone"
            className="pointer-events-none absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none object-contain object-bottom"
            draggable={false}
          />
        </div>

        <div className="flex animate-fade-up flex-col justify-center overflow-hidden rounded-3xl border border-ink-200 bg-white p-8 sm:p-10 lg:p-14">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
            <Sparkle size={12} weight="fill" /> A marketplace, reimagined
          </span>
          <h1 className="mt-5 max-w-[15ch] font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            One place. <span className="italic text-ink-400">Thousands</span> of sellers.
          </h1>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-ink-600">
            Discover great products at honest prices — easy returns and cash on delivery, across India.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3.5 text-sm font-semibold text-white shadow-pop transition duration-300 ease-smooth hover:gap-3 hover:bg-ink-800 active:scale-[0.98]"
            >
              Start shopping
              <ArrowRight size={16} className="transition-transform duration-300 ease-smooth group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/seller"
              className="inline-flex items-center gap-2 rounded-full border border-ink-300 bg-white px-6 py-3.5 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white active:scale-[0.98]"
            >
              <Storefront size={16} />
              Sell on BazaarX
            </Link>
          </div>
        </div>

        {heroSlides.length > 0 ? (
          <HeroSlider slides={heroSlides} />
        ) : (
          <Link
            href="/search"
            className="group relative block overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 p-4"
          >
            {/* Decorative sparkles. */}
            <Sparkle size={26} weight="fill" className="absolute right-6 top-5 text-ink-300" />
            <Sparkle size={14} weight="fill" className="absolute right-16 top-12 text-ink-200" />

            <div className="grid h-full min-h-[300px] grid-cols-3 grid-rows-3 gap-3">
              <div className="col-span-2 row-span-2 flex flex-col justify-between rounded-2xl bg-ink-900 p-5 text-white shadow-pop">
                <ShoppingBag size={34} weight="fill" />
                <div>
                  <div className="font-display text-xl font-bold leading-tight">Shop the latest drops</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-sm text-ink-300 transition-transform group-hover:translate-x-0.5">
                    Browse all <ArrowRight size={14} weight="bold" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-white text-ink-700">
                <Sparkle size={26} weight="fill" />
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-white text-ink-700">
                <TShirt size={28} weight="fill" />
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-white text-ink-700">
                <DeviceMobile size={26} weight="fill" />
              </div>
              <div className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-white text-ink-700">
                <Sneaker size={26} weight="fill" />
                <span className="font-display text-sm font-semibold">Fashion · Tech · Home &amp; more</span>
              </div>
            </div>
          </Link>
        )}
      </section>

      {/* First-order coupon callout — the single chromatic accent. */}
      <CouponBanner code="FIRST30" percent={30} />

      {/* New arrivals. */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900">New arrivals</h2>
          <Link
            href="/search"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-ink-900 transition-all hover:gap-2"
          >
            View all <ArrowRight size={15} weight="bold" />
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
