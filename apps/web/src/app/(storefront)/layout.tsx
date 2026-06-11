import Link from "next/link";
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
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="container flex items-center gap-6 py-3">
          <Link href="/" className="text-lg font-semibold">
            BazaarX
          </Link>
          <SearchBar />
          <HeaderActions />
        </div>
        <nav className="container flex gap-4 overflow-x-auto pb-2 text-sm text-slate-600">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="whitespace-nowrap hover:text-brand">
              {c.name}
            </Link>
          ))}
        </nav>
      </header>

      <main className="container py-6">{children}</main>

      <footer className="mt-12 border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        BazaarX — multi-vendor marketplace
      </footer>
    </div>
  );
}
