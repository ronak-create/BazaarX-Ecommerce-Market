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

/** Request body for POST /api/seller/register. */
export interface SellerRegisterInput {
  businessName: string;
  gstin?: string;
  panNumber?: string;
  bankAccount?: string;
  ifsc?: string;
  documents: string[]; // Supabase Storage paths returned by /api/upload/sign
}

/** Seller profile shape returned to the seller and admin. */
export interface SellerProfileDTO {
  id: string;
  businessName: string;
  gstin: string | null;
  panNumber: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  rejectionReason: string | null;
  documents: string[];
  createdAt: string;
}

/** One row in the admin KYC review queue (GET /api/admin/kyc). */
export interface KycListItem extends SellerProfileDTO {
  user: { id: string; name: string | null; email: string | null; phone: string | null };
}

/** Body for POST /api/admin/kyc/:id/reject. */
export interface KycRejectInput {
  rejectionReason: string;
}

/** Storage buckets accepted by POST /api/upload/sign. */
export type UploadBucket = "products" | "kyc" | "reviews";

/** Request/response for POST /api/upload/sign. */
export interface UploadSignInput {
  bucket: UploadBucket;
  fileName: string;
  contentType: string;
}
export interface UploadSignResult {
  path: string;
  signedUrl: string;
  token: string;
}
