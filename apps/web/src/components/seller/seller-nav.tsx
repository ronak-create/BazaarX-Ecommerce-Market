"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Package,
  Receipt,
  Wallet,
  IdentificationBadge,
  type Icon,
} from "@phosphor-icons/react";

const NAV: { href: string; label: string; icon: Icon; exact?: boolean }[] = [
  { href: "/seller", label: "Dashboard", icon: SquaresFour, exact: true },
  { href: "/seller/products", label: "Products", icon: Package },
  { href: "/seller/orders", label: "Orders", icon: Receipt },
  { href: "/seller/earnings", label: "Earnings", icon: Wallet },
  { href: "/seller/onboarding", label: "Onboarding", icon: IdentificationBadge },
];

export function SellerNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0">
      <span className="hidden px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-ink-400 lg:block">
        Menu
      </span>
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`group relative inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-ink-900 text-white shadow-pop"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            }`}
          >
            <Icon size={18} weight={active ? "fill" : "regular"} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
