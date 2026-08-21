import { requireApprovedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCoins } from "@/lib/utils";
import Link from "next/link";
import { Sparkles } from "lucide-react";

const ADSTERRA_DAILY_LIMIT = 120;
const BLOGGER_DAILY_LIMIT = 50;

function tierBadgeLabel(tier: string) {
  switch (tier) {
    case "tier1":
      return "PREMIUM TIER 1";
    case "tier2":
      return "PREMIUM TIER 2";
    default:
      return "FREE USER";
  }
}

function AnalyticsCard({
  logo,
  logoClass,
  value,
  valueClass,
  subtitle,
  label,
  labelClass,
  progress,
}: {
  logo: string;
  logoClass: string;
  value: number;
  valueClass: string;
  subtitle: string;
  label: string;
  labelClass: string;
  progress?: number;
}) {
  return (
    <div className="dashboard-analytics-card">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white ${logoClass}`}
      >
        {logo}
      </div>
      <p className={`mt-3 text-3xl font-bold leading-none ${valueClass}`}>
        {formatCoins(value)}
      </p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      <p className={`mt-3 text-xs font-semibold tracking-wide ${labelClass}`}>
        {label}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const { profile } = await requireApprovedUser();
  const supabase = createAdminClient();

  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00.000Z`;

  const [
    { count: adsterraTasksToday },
    { count: bloggerTasksToday },
    { count: adsterraCampaigns },
    { count: bloggerCampaigns },
    { count: onlineMembers },
  ] = await Promise.all([
    supabase
      .from("task_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("task_type", "runner_view")
      .gte("created_at", todayStart),
    supabase
      .from("task_completions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("task_type", "platform_task")
      .gte("created_at", todayStart),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_status", "approved"),
  ]);

  const adsterraCompleted = adsterraTasksToday || 0;
  const bloggerCompleted = bloggerTasksToday || 0;
  const adsterraLeft = Math.max(ADSTERRA_DAILY_LIMIT - adsterraCompleted, 0);
  const bloggerLeft = Math.max(BLOGGER_DAILY_LIMIT - bloggerCompleted, 0);
  const adsterraProgress =
    (adsterraCompleted / ADSTERRA_DAILY_LIMIT) * 100;
  const bloggerProgress = (bloggerCompleted / BLOGGER_DAILY_LIMIT) * 100;

  return (
    <div className="dashboard-page safe-top -mx-4 space-y-6 px-4 sm:-mx-6 sm:px-6">
      <header className="flex items-start justify-between gap-3 pt-2">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-600">Welcome Back,</p>
            <span className="mt-1 inline-block rounded-full bg-violet-100 px-3 py-0.5 text-[11px] font-bold tracking-wide text-violet-700">
              {tierBadgeLabel(profile.premium_tier)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm"
            aria-label="Language"
          >
            EN
          </button>
          <Link
            href="/premium"
            className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 shadow-sm"
          >
            <span aria-hidden className="text-base leading-none">
              🏅
            </span>
            PREMIUM
          </Link>
        </div>
      </header>

      <section className="dashboard-balance-card relative overflow-hidden rounded-3xl p-5 text-white shadow-xl">
        <div className="dashboard-balance-card__waves" aria-hidden />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-white/80">
              YOUR BALANCE
            </p>
            <p className="mt-2 text-4xl font-bold leading-tight">
              {formatCoins(profile.coin_balance)}{" "}
              <span className="text-2xl font-semibold">Points</span>
            </p>
          </div>
          <div className="dashboard-coin-stack shrink-0" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="relative z-10 mt-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-white/90">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Online Members: {onlineMembers || 0}
          </div>
          <Link
            href="/wallet"
            className="rounded-full border border-white/30 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2 text-xs font-bold tracking-wide text-white shadow-lg"
          >
            BUY COIN
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Real-time Analytics
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <AnalyticsCard
            logo="A"
            logoClass="bg-red-500"
            value={adsterraCompleted}
            valueClass="text-slate-900"
            subtitle={`${adsterraLeft} Left`}
            label="Adsterra Task"
            labelClass="text-violet-600"
            progress={adsterraProgress}
          />
          <AnalyticsCard
            logo="A"
            logoClass="bg-red-500"
            value={adsterraCampaigns || 0}
            valueClass="text-emerald-600"
            subtitle="Active Campaigns"
            label="ADSTERRA"
            labelClass="text-emerald-600"
          />
          <AnalyticsCard
            logo="B"
            logoClass="bg-orange-500"
            value={bloggerCompleted}
            valueClass="text-slate-900"
            subtitle={`${bloggerLeft} Left`}
            label="Blogger Task"
            labelClass="text-orange-500"
            progress={bloggerProgress}
          />
          <AnalyticsCard
            logo="B"
            logoClass="bg-orange-500"
            value={bloggerCampaigns || 0}
            valueClass="text-orange-500"
            subtitle="Active Campaigns"
            label="BLOGGER"
            labelClass="text-orange-500"
          />
        </div>
      </section>
    </div>
  );
}
