import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [
    { count: userCount },
    { count: pendingUsers },
    { count: activeCampaigns },
    { count: totalImpressions },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_status", "pending"),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("campaign_impressions")
      .select("*", { count: "exact", head: true })
      .eq("is_valid", true),
  ]);

  const stats = [
    { label: "Total Users", value: userCount || 0 },
    { label: "Pending Approvals", value: pendingUsers || 0 },
    { label: "Active Campaigns", value: activeCampaigns || 0 },
    { label: "Valid Impressions", value: totalImpressions || 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-slate-600">Platform statistics and management.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="!p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
