import Link from "next/link";
import { ArrowLeft, Handshake } from "@phosphor-icons/react/dist/ssr";
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
      <aside className="w-56 shrink-0 border-r border-ink-200 bg-ink-50 p-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">
            <Handshake size={18} weight="fill" />
          </span>
          <span className="font-display text-base font-semibold text-ink-900">Reseller</span>
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
