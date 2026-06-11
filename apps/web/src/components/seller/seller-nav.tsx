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
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700"
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
