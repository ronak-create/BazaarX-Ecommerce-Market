import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KycForm } from "@/components/seller/kyc-form";
import { StatusBanner } from "@/components/seller/status-banner";
import type { SellerProfileDTO } from "@bazaarx/types";

export const dynamic = "force-dynamic";

export default async function SellerOnboardingPage() {
  const user = await requireUser();
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
  });

  const dto: SellerProfileDTO | null = profile && {
    id: profile.id,
    businessName: profile.businessName,
    gstin: profile.gstin,
    panNumber: profile.panNumber,
    bankAccount: profile.bankAccount,
    ifsc: profile.ifsc,
    status: profile.status,
    rejectionReason: profile.rejectionReason,
    documents: profile.documents,
    createdAt: profile.createdAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Seller onboarding</h1>
        <p className="mt-1 text-sm text-slate-500">
          Provide your business and bank details to start selling on BazaarX.
        </p>
      </header>

      {dto && <StatusBanner profile={dto} />}

      {/* No application yet, or a rejected one that can be resubmitted. */}
      {(!dto || dto.status === "REJECTED") && (
        <section className="rounded-lg border border-slate-200 p-6">
          <h2 className="mb-4 text-lg font-medium">
            {dto?.status === "REJECTED" ? "Resubmit application" : "Business details"}
          </h2>
          <KycForm
            defaults={
              dto
                ? {
                    businessName: dto.businessName,
                    gstin: dto.gstin ?? undefined,
                    panNumber: dto.panNumber ?? undefined,
                    bankAccount: dto.bankAccount ?? undefined,
                    ifsc: dto.ifsc ?? undefined,
                    documents: dto.documents,
                  }
                : undefined
            }
            submitLabel={dto?.status === "REJECTED" ? "Resubmit" : "Submit for review"}
          />
        </section>
      )}
    </div>
  );
}
