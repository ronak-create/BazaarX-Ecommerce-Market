import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@bazaarx/db";

const NAV = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/kyc", label: "Seller KYC" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/commissions", label: "Commissions" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/banners", label: "Banners" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRole.ADMIN);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-slate-900 p-4 text-slate-100">
        <div className="mb-6 text-lg font-semibold">BazaarX Admin</div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
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
