"use client";

import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { UserMenu } from "@/components/auth/user-menu";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-brand-fg">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function HeaderActions() {
  const cart = useCart();
  const wishlist = useWishlist();

  return (
    <div className="flex items-center gap-4">
      <Link href="/wishlist" className="relative text-sm text-slate-600 hover:text-slate-900">
        Wishlist
        <Badge count={wishlist.data?.length ?? 0} />
      </Link>
      <Link href="/cart" className="relative text-sm text-slate-600 hover:text-slate-900">
        Cart
        <Badge count={cart.data?.itemCount ?? 0} />
      </Link>
      <UserMenu />
    </div>
  );
}
