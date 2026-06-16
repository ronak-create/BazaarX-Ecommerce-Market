import Link from "next/link";
import {
  ShoppingBag,
  InstagramLogo,
  XLogo,
  YoutubeLogo,
  ArrowRight,
  ShieldCheck,
  Truck,
  CreditCard,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { SearchBar } from "@/components/storefront/search-bar";
import { HeaderActions } from "@/components/storefront/header-actions";
import { Marquee } from "@/components/storefront/marquee";

const FOOTER_COLS = [
  {
    title: "Shop",
    links: [
      { label: "All products", href: "/search" },
      { label: "New arrivals", href: "/search?sort=new" },
      { label: "Categories", href: "/search" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Sell on BazaarX", href: "/seller" },
      { label: "Seller hub", href: "/seller" },
      { label: "Become a reseller", href: "/reseller/join" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Track order", href: "/orders" },
      { label: "Returns & refunds", href: "/orders" },
      { label: "Your account", href: "/account" },
    ],
  },
];

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await prisma.category.findMany({
    where: { level: 1 },
    orderBy: { name: "asc" },
    take: 8,
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-ink-50">
      <Marquee />
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-ink-50/80 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-50/65">
        <div className="container flex h-16 items-center gap-4 sm:gap-6">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-fg shadow-pop transition-transform duration-300 group-hover:-rotate-6">
              <ShoppingBag size={20} weight="fill" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">
              Bazaar<span className="text-brand-600">X</span>
            </span>
          </Link>

          <div className="hidden flex-1 sm:block">
            <SearchBar />
          </div>

          <HeaderActions />
        </div>

        {/* Search drops to its own row on mobile. */}
        <div className="container pb-3 sm:hidden">
          <SearchBar />
        </div>

        <nav className="border-t border-ink-200/60">
          <div className="container flex gap-1 overflow-x-auto py-2 text-sm">
            <Link
              href="/search"
              className="whitespace-nowrap rounded-full px-3 py-1.5 font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-brand-700"
            >
              All products
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-brand-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="container flex-1 py-8">{children}</main>

      <footer className="mt-20 bg-ink-900 text-ink-300">
        {/* Newsletter band */}
        <div className="border-b border-white/10">
          <div className="container flex flex-col gap-5 py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-xl font-semibold text-white">Get the good stuff first.</h3>
              <p className="mt-1 text-sm text-ink-400">Offers, new drops and price alerts — straight to your inbox.</p>
            </div>
            <form className="flex w-full max-w-sm items-center gap-2">
              <input
                type="email"
                required
                placeholder="you@email.com"
                aria-label="Email address"
                className="h-11 w-full rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-ink-500 focus:border-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-white px-5 text-sm font-semibold text-ink-900 transition hover:bg-ink-200 active:scale-[0.98]"
              >
                Subscribe <ArrowRight size={15} weight="bold" />
              </button>
            </form>
          </div>
        </div>

        {/* Link columns */}
        <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink-900">
                <ShoppingBag size={18} weight="fill" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">BazaarX</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
              A multi-vendor marketplace for independent sellers — honest prices, easy returns and cash on delivery
              across India.
            </p>
            <div className="mt-5 flex gap-2">
              {[InstagramLogo, XLogo, YoutubeLogo].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ink-300 transition-colors hover:border-white hover:text-white"
                  aria-label="Social link"
                >
                  <Icon size={16} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-semibold uppercase tracking-widest text-ink-500">{col.title}</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-ink-300 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Assurance + copyright bar */}
        <div className="border-t border-white/10">
          <div className="container flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-400">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} weight="fill" /> Secure checkout</span>
              <span className="inline-flex items-center gap-1.5"><Truck size={14} weight="fill" /> Fast delivery</span>
              <span className="inline-flex items-center gap-1.5"><CreditCard size={14} weight="fill" /> COD available</span>
            </div>
            <div className="text-xs text-ink-500">
              © {new Date().getFullYear()} BazaarX. Built for buyers and sellers.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
