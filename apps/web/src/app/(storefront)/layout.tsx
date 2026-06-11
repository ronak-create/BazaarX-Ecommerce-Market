import Link from "next/link";
import { ShoppingBag } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { SearchBar } from "@/components/storefront/search-bar";
import { HeaderActions } from "@/components/storefront/header-actions";

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

      <footer className="mt-16 border-t border-ink-200 bg-white">
        <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">
              <ShoppingBag size={18} weight="fill" />
            </span>
            <div>
              <div className="font-display font-semibold text-ink-900">BazaarX</div>
              <div className="text-xs text-ink-500">A marketplace for independent sellers.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
            <Link href="/search" className="transition-colors hover:text-ink-900">Shop</Link>
            <Link href="/seller" className="transition-colors hover:text-ink-900">Sell on BazaarX</Link>
            <Link href="/orders" className="transition-colors hover:text-ink-900">Track order</Link>
          </div>
        </div>
        <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} BazaarX. Built for buyers and sellers.
        </div>
      </footer>
    </div>
  );
}
