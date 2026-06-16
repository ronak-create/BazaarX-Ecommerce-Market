"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartBar,
  IdentificationBadge,
  FolderSimple,
  Percent,
  Ticket,
  Users,
  Scales,
  Image as ImageIcon,
  type Icon,
} from "@phosphor-icons/react";

const NAV: { href: string; label: string; icon: Icon; exact?: boolean }[] = [
  { href: "/admin", label: "Analytics", icon: ChartBar, exact: true },
  { href: "/admin/kyc", label: "Seller KYC", icon: IdentificationBadge },
  { href: "/admin/categories", label: "Categories", icon: FolderSimple },
  { href: "/admin/commissions", label: "Commissions", icon: Percent },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/disputes", label: "Disputes", icon: Scales },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        const Icon = n.icon;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-ink-900 shadow-pop"
                : "text-ink-300 hover:bg-white/10 hover:text-white"
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
