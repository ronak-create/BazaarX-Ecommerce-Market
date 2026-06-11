import { z } from "zod";

/** Shared zod schemas reused across API routes and forms. */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const indianPhoneSchema = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Invalid Indian phone number");

export const pincodeSchema = z.string().regex(/^\d{6}$/, "Invalid pincode");

export const gstinSchema = z
  .string()
  .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/, "Invalid GSTIN")
  .optional();

export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN")
  .optional();

export const moneySchema = z.coerce.number().nonnegative().finite();

export type Pagination = z.infer<typeof paginationSchema>;
