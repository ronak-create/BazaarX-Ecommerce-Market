import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, SellerStatus } from "@bazaarx/db";
import { uniqueSlug } from "@bazaarx/utils";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError, forbidden, unauthorized } from "@/lib/api";
import type { UploadSignResult } from "@bazaarx/types";

const bodySchema = z.object({
  bucket: z.enum(["products", "kyc", "reviews"]),
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1),
});

/**
 * POST /api/upload/sign
 * Returns a Supabase Storage signed upload URL. The client PUTs the file
 * directly, then sends the returned `path` back when creating the record.
 * Files are namespaced per user to keep buckets tidy and access scoped.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError("VALIDATION", "Invalid JSON body", 422);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input", 422);
  }
  const { bucket, fileName } = parsed.data;

  // Only approved sellers may upload product images.
  if (bucket === "products") {
    const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
    if (!seller || seller.status !== SellerStatus.APPROVED) {
      return forbidden("Approved seller account required");
    }
  }

  const ext = fileName.includes(".") ? fileName.split(".").pop() : undefined;
  const path = `${user.id}/${uniqueSlug(fileName.replace(/\.[^.]+$/, ""))}${ext ? `.${ext}` : ""}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return apiError("UPLOAD_SIGN_FAILED", error?.message ?? "Could not sign upload", 502);
  }

  const result: UploadSignResult = {
    path: data.path,
    signedUrl: data.signedUrl,
    token: data.token,
  };
  return NextResponse.json(result);
}
