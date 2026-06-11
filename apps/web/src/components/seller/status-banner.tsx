import { ClockCounterClockwise, CheckCircle, XCircle, Prohibit } from "@phosphor-icons/react/dist/ssr";
import type { SellerProfileDTO } from "@bazaarx/types";

type IconCmp = typeof CheckCircle;

const STYLES: Record<SellerProfileDTO["status"], { box: string; chip: string; label: string; icon: IconCmp }> = {
  PENDING: { box: "border-amber-200 bg-amber-50", chip: "text-amber-700", label: "Under review", icon: ClockCounterClockwise },
  APPROVED: { box: "border-emerald-200 bg-emerald-50", chip: "text-emerald-700", label: "Approved", icon: CheckCircle },
  REJECTED: { box: "border-accent/30 bg-accent/5", chip: "text-accent", label: "Rejected", icon: XCircle },
  SUSPENDED: { box: "border-ink-300 bg-ink-100", chip: "text-ink-700", label: "Suspended", icon: Prohibit },
};

const MESSAGES: Record<SellerProfileDTO["status"], string> = {
  PENDING: "Your seller application is being reviewed. You'll be notified once a decision is made.",
  APPROVED: "You're verified — you can now list products and manage orders.",
  REJECTED: "Your application was rejected. Review the reason below and resubmit.",
  SUSPENDED: "Your seller account is suspended. Contact support for help.",
};

export function StatusBanner({ profile }: { profile: SellerProfileDTO }) {
  const s = STYLES[profile.status];
  const Icon = s.icon;
  return (
    <div className={`rounded-2xl border p-4 ${s.box}`}>
      <div className={`flex items-center gap-2 ${s.chip}`}>
        <Icon size={18} weight="fill" />
        <span className="text-sm font-semibold">{s.label}</span>
      </div>
      <p className="mt-1.5 text-sm text-ink-700">{MESSAGES[profile.status]}</p>
      {profile.status === "REJECTED" && profile.rejectionReason && (
        <p className="mt-2 text-sm font-medium text-ink-900">Reason: {profile.rejectionReason}</p>
      )}
    </div>
  );
}
