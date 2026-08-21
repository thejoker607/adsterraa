import { requireApprovedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CopyButton } from "@/components/profile/copy-button";
import { DailyLoginButton } from "@/components/dashboard/daily-login-button";

export default async function ProfilePage() {
  const { profile } = await requireApprovedUser();
  const supabase = createAdminClient();

  const { data: transactions } = await supabase
    .from("coin_transactions")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const tierLabels = {
    free: "Free",
    tier1: "Premium Tier 1",
    tier2: "Premium Tier 2",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-slate-600">Your account information and settings.</p>
      </div>

      <Card title="Account Details">
        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Full Name</dt>
            <dd className="text-sm font-medium">{profile.full_name || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="text-sm font-medium">{profile.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Status</dt>
            <dd>{statusBadge(profile.account_status)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Premium Tier</dt>
            <dd>
              <Badge variant="premium">{tierLabels[profile.premium_tier]}</Badge>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Coin Balance</dt>
            <dd className="text-sm font-medium">
              {profile.coin_balance.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Member Since</dt>
            <dd className="text-sm font-medium">{formatDate(profile.created_at)}</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-slate-100 pt-4">
          <DailyLoginButton lastLogin={profile.last_daily_login} />
        </div>
      </Card>

      <Card title="Referral Code" description="Share your code to earn referral bonuses when friends join.">
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-lg bg-slate-100 px-4 py-2 font-mono text-sm">
            {profile.referral_code}
          </code>
          <CopyButton text={profile.referral_code} />
        </div>
      </Card>

      <Card title="Activity History">
        {transactions && transactions.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {tx.description || tx.transaction_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-500">{formatDate(tx.created_at)}</p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    tx.amount >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No activity yet.</p>
        )}
      </Card>
    </div>
  );
}
