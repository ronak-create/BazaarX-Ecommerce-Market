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

// ──────────────────────────── Categories ────────────────────────────

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  level: number;
  children: CategoryNode[];
}

export interface CategoryInput {
  name: string;
  parentId?: string | null;
  imageUrl?: string | null;
}

// ──────────────────────────── Products ────────────────────────────

export interface VariantInput {
  id?: string; // present when editing an existing variant
  label: string;
  attributes: Record<string, string>;
  price: string; // decimal as string
  stock: number;
  sku: string;
}

export interface ImageInput {
  url: string;
  altText?: string;
  position: number;
  isPrimary: boolean;
}

export type ProductStatusInput = "DRAFT" | "ACTIVE" | "PAUSED";

export interface ProductInput {
  categoryId: string;
  name: string;
  description: string;
  basePrice: string;
  discountedPrice?: string | null;
  brand?: string | null;
  tags?: string[];
  status?: ProductStatusInput;
  variants: VariantInput[];
  images: ImageInput[];
}

export interface ProductVariantDTO {
  id: string;
  label: string;
  attributes: Record<string, string>;
  price: string;
  stock: number;
  sku: string;
}

export interface ProductImageDTO {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  isPrimary: boolean;
}

export interface ProductDTO {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  discountedPrice: string | null;
  brand: string | null;
  tags: string[];
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "REMOVED";
  avgRating: number;
  totalReviews: number;
  variants: ProductVariantDTO[];
  images: ProductImageDTO[];
  createdAt: string;
}

/** Compact row for the seller product table and public listings. */
export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  discountedPrice: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "REMOVED";
  primaryImage: string | null;
  totalStock: number;
  avgRating: number;
}

/** Result of POST /api/seller/products/bulk. */
export interface BulkUploadResult {
  created: number;
  failed: number;
  errors: { row: number; message: string }[];
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
