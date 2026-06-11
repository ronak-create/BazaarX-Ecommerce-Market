// Shared API DTOs and a re-export of Prisma enums so apps share one source of truth.
export {
  UserRole,
  SellerStatus,
  ProductStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PayoutStatus,
  DisputeStatus,
  DiscountType,
  CommissionStatus,
  BannerPosition,
} from "@bazaarx/db";

/** Standard error envelope returned by all API routes. */
export interface ApiError {
  error: { code: string; message: string };
}

/** Standard paginated list envelope. */
export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

/** Merged auth profile returned by /api/auth/me and /api/auth/sync. */
export interface AuthProfile {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar: string | null;
  role: "BUYER" | "SELLER" | "RESELLER" | "ADMIN";
  isVerified: boolean;
  isSeller: boolean;
  isReseller: boolean;
}
