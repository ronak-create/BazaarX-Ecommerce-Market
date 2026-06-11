import type { SellerProfileDTO } from "@bazaarx/types";

const STYLES: Record<SellerProfileDTO["status"], { box: string; label: string }> = {
  PENDING: { box: "border-amber-200 bg-amber-50 text-amber-800", label: "Under review" },
  APPROVED: { box: "border-green-200 bg-green-50 text-green-800", label: "Approved" },
  REJECTED: { box: "border-red-200 bg-red-50 text-red-800", label: "Rejected" },
  SUSPENDED: { box: "border-slate-300 bg-slate-50 text-slate-700", label: "Suspended" },
};

const MESSAGES: Record<SellerProfileDTO["status"], string> = {
  PENDING: "Your seller application is being reviewed. You'll be notified once a decision is made.",
  APPROVED: "You're verified — you can now list products and manage orders.",
  REJECTED: "Your application was rejected. Review the reason below and resubmit.",
  SUSPENDED: "Your seller account is suspended. Contact support for help.",
};

export function StatusBanner({ profile }: { profile: SellerProfileDTO }) {
  const s = STYLES[profile.status];
  return (
    <div className={`rounded-lg border p-4 ${s.box}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide">{s.label}</span>
      </div>
      <p className="mt-1 text-sm">{MESSAGES[profile.status]}</p>
      {profile.status === "REJECTED" && profile.rejectionReason && (
        <p className="mt-2 text-sm font-medium">Reason: {profile.rejectionReason}</p>
      )}
    </div>
  );
}
