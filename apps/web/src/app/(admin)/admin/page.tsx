import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <AnalyticsDashboard />
    </div>
  );
}
