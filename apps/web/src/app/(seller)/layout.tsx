import Link from "next/link";
import { ArrowLeft, Storefront } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";

const NAV = [
  { href: "/seller/onboarding", label: "Onboarding" },
  { href: "/seller", label: "Dashboard" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/earnings", label: "Earnings" },
];

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Any authenticated user can reach the seller area to begin onboarding;
  // dashboard/product pages enforce SELLER + APPROVED individually.
  await requireUser();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-ink-200 bg-ink-50 p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">
            <Storefront size={18} weight="fill" />
          </span>
          <span className="font-display text-base font-semibold text-ink-900">Seller</span>
        </Link>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-brand-700"
        >
          <ArrowLeft size={14} /> Back to store
        </Link>
        <nav className="mt-6 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-200"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
