import { requireApprovedUser } from "@/lib/auth/user";
import { Card } from "@/components/ui/card";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CopyButton } from "@/components/profile/copy-button";

export default async function ProfilePage() {
  const { profile } = await requireApprovedUser();

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
            <dd className="text-sm font-medium">{profile.coin_balance.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-slate-500">Member Since</dt>
            <dd className="text-sm font-medium">{formatDate(profile.created_at)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Referral Code" description="Share your code to earn referral bonuses when friends join.">
        <div className="flex items-center gap-3">
          <code className="flex-1 rounded-lg bg-slate-100 px-4 py-2 font-mono text-sm">
            {profile.referral_code}
          </code>
          <CopyButton text={profile.referral_code} />
        </div>
      </Card>
    </div>
  );
}
