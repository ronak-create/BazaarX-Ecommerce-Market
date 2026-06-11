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

// ──────────────────────────── Cart & Wishlist ────────────────────────────

export interface CartItemDTO {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantLabel: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  image: string | null;
  stock: number;
  sellerId: string;
  sellerName: string;
}

export interface CartSellerGroup {
  sellerId: string;
  sellerName: string;
  items: CartItemDTO[];
  subtotal: string;
}

export interface CartDTO {
  groups: CartSellerGroup[];
  itemCount: number;
  subtotal: string;
}

export interface AddCartItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface WishlistItemDTO {
  productId: string;
  name: string;
  slug: string;
  basePrice: string;
  discountedPrice: string | null;
  image: string | null;
  avgRating: number;
}

// ──────────────────────────── Addresses ────────────────────────────

export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface AddressDTO extends AddressInput {
  id: string;
  line2: string;
  isDefault: boolean;
}

// ──────────────────────────── Orders & Payments ────────────────────────────

export type OrderStatusDTO =
  | "PLACED"
  | "CONFIRMED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED";

export type PaymentMethodDTO = "RAZORPAY" | "COD";
export type PaymentStatusDTO = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface CreateOrderInput {
  addressId: string;
  paymentMethod: PaymentMethodDTO;
}

export interface OrderItemDTO {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  image: string | null;
}

export interface OrderTrackingDTO {
  id: string;
  status: OrderStatusDTO;
  message: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  timestamp: string;
}

export interface OrderSummaryDTO {
  id: string;
  status: OrderStatusDTO;
  paymentMethod: PaymentMethodDTO;
  paymentStatus: PaymentStatusDTO;
  totalAmount: string;
  itemCount: number;
  sellerName: string;
  buyerName: string | null;
  createdAt: string;
  primaryImage: string | null;
}

export interface OrderDetailDTO extends OrderSummaryDTO {
  platformFee: string;
  sellerAmount: string;
  items: OrderItemDTO[];
  tracking: OrderTrackingDTO[];
  address: AddressDTO;
  trackingNumber: string | null;
  carrier: string | null;
}

/** Returned by POST /api/orders. For RAZORPAY, `razorpay` carries the checkout payload. */
export interface CreateOrderResult {
  orderIds: string[];
  razorpay?: {
    razorpayOrderId: string;
    amount: number; // paise
    currency: string;
    keyId: string;
  };
}

/** Body for POST /api/payments/verify (client-side confirmation). */
export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// ──────────────────────────── Reseller ────────────────────────────

export interface CreateLinkInput {
  productId: string;
  margin: string; // decimal as string, added per unit
}

export interface ResellerLinkDTO {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  margin: string;
  slug: string;
  shareUrl: string;
  clicks: number;
  conversions: number;
}

export interface ResellerDashboardDTO {
  totalEarnings: string;
  pendingEarnings: string;
  linkCount: number;
  totalConversions: number;
}

export interface CommissionDTO {
  id: string;
  orderId: string;
  amount: string;
  status: "PENDING" | "PAID";
  productName: string;
  createdAt: string;
}

// ──────────────────────────── Reviews ────────────────────────────

export interface CreateReviewInput {
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  body?: string;
  images?: string[];
}

export interface ReviewDTO {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  helpfulCount: number;
  authorName: string;
  createdAt: string;
  isMine: boolean;
}

export interface ReviewSummaryDTO {
  reviews: ReviewDTO[];
  avgRating: number;
  totalReviews: number;
  /** An order id the caller can review this product against, if eligible. */
  eligibleOrderId: string | null;
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
