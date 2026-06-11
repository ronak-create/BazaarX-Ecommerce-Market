import Link from "next/link";
import { requireUser } from "@/lib/auth";

const NAV = [
  { href: "/reseller", label: "Dashboard" },
  { href: "/reseller/links", label: "My links" },
  { href: "/reseller/earnings", label: "Earnings" },
];

export default async function ResellerLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
        <div className="mb-6 text-lg font-semibold">BazaarX Reseller</div>
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
