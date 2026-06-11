import Link from "next/link";
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
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
        <div className="mb-6 text-lg font-semibold">BazaarX Seller</div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
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
