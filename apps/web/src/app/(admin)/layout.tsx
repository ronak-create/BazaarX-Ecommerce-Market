import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
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
      <aside className="w-56 shrink-0 border-r border-ink-800 bg-ink-900 p-4 text-ink-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">
            <ShieldCheck size={18} weight="fill" />
          </span>
          <span className="font-display text-base font-semibold text-white">Admin</span>
        </Link>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} /> Back to store
        </Link>
        <nav className="mt-6 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm text-ink-300 transition-colors hover:bg-ink-800"
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
