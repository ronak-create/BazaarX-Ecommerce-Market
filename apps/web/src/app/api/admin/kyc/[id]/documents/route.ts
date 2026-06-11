import { NextResponse } from "next/server";
import { prisma, UserRole } from "@bazaarx/db";
import { authorizeApi } from "@/lib/auth";
import { forbidden, notFound, unauthorized } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/kyc/:id/documents — short-lived signed URLs for a seller's
 * KYC documents (stored in the private `kyc` bucket). Admin only.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await authorizeApi(UserRole.ADMIN);
  if (!auth.ok) return auth.status === 401 ? unauthorized() : forbidden();

  const seller = await prisma.sellerProfile.findUnique({ where: { id: params.id } });
  if (!seller) return notFound("Seller application not found");

  const supabase = createAdminClient();
  const urls = await Promise.all(
    seller.documents.map(async (path) => {
      const { data } = await supabase.storage.from("kyc").createSignedUrl(path, 120);
      return { name: path.split("/").pop() ?? path, url: data?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({ documents: urls.filter((u) => u.url) });
}
