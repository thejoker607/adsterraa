import { requireApprovedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge, statusBadge } from "@/components/ui/badge";
import { formatCoins, formatDate } from "@/lib/utils";
import {
  Coins,
  Megaphone,
  Activity,
  Gift,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DailyLoginButton } from "@/components/dashboard/daily-login-button";

export default async function DashboardPage() {
  const { profile } = await requireApprovedUser();
  const supabase = createAdminClient();

  const [{ data: campaigns }, { data: transactions }, { data: promotions }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("id, status, current_impressions, target_impressions")
        .eq("user_id", profile.id),
      supabase
        .from("coin_transactions")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("promotions")
        .select("id, title, status")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const activeCampaigns =
    campaigns?.filter((c) => c.status === "active").length || 0;
  const totalImpressions =
    campaigns?.reduce((sum, c) => sum + c.current_impressions, 0) || 0;

  const tierLabels = {
    free: "Free",
    tier1: "Premium Tier 1",
    tier2: "Premium Tier 2",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Welcome back, {profile.full_name || profile.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Coin Balance</p>
              <p className="text-xl font-bold">{formatCoins(profile.coin_balance)}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Campaigns</p>
              <p className="text-xl font-bold">{activeCampaigns}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Impressions</p>
              <p className="text-xl font-bold">{formatCoins(totalImpressions)}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Premium Tier</p>
              <p className="text-lg font-bold">{tierLabels[profile.premium_tier]}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Account Status">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Status</span>
              {statusBadge(profile.account_status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Premium</span>
              <Badge variant="premium">{tierLabels[profile.premium_tier]}</Badge>
            </div>
            <DailyLoginButton lastLogin={profile.last_daily_login} />
          </div>
        </Card>

        <Card
          title="Quick Actions"
          description="Get started with these common tasks"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/promotions/create">
              <Button variant="outline" className="w-full">
                <Gift className="h-4 w-4" />
                Create Promotion
              </Button>
            </Link>
            <Link href="/runner">
              <Button variant="outline" className="w-full">
                Start Runner
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent Promotions">
          {promotions && promotions.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {promotions.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium truncate">{p.title}</span>
                  {statusBadge(p.status)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No promotions yet.</p>
          )}
        </Card>

        <Card title="Activity History">
          {transactions && transactions.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{tx.description || tx.transaction_type}</p>
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
    </div>
  );
}
