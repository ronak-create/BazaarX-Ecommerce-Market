"use client";

import Link from "next/link";
import { Heart, ShoppingCart } from "@phosphor-icons/react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { UserMenu } from "@/components/auth/user-menu";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      key={count}
      className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] animate-badge-pop place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-fg ring-2 ring-ink-50"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 hover:text-brand-700 active:scale-95"
    >
      {children}
    </Link>
  );
}

export function HeaderActions() {
  const cart = useCart();
  const wishlist = useWishlist();

  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      <IconLink href="/wishlist" label="Wishlist">
        <Heart size={22} />
        <Badge count={wishlist.data?.length ?? 0} />
      </IconLink>
      <IconLink href="/cart" label="Cart">
        <ShoppingCart size={22} />
        <Badge count={cart.data?.itemCount ?? 0} />
      </IconLink>
      <div className="ml-1">
        <UserMenu />
      </div>
    </div>
  );
}
