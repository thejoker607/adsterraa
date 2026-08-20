import { NextResponse } from "next/server";
import { requireApprovedUser, getPlatformConfig } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`daily-login:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { profile } = await requireApprovedUser();
    const config = await getPlatformConfig();
    const today = new Date().toISOString().split("T")[0];
    const supabase = createAdminClient();

    if (profile.last_daily_login === today) {
      return NextResponse.json(
        { error: "Daily login reward already claimed today" },
        { status: 400 }
      );
    }

    const referenceKey = `daily_${today}`;
    const { error: completionError } = await supabase
      .from("task_completions")
      .insert({
        user_id: profile.id,
        task_type: "daily_login",
        reference_key: referenceKey,
        coins_earned: config.coin_rewards.daily_login,
      });

    if (completionError) {
      if (completionError.code === "23505") {
        return NextResponse.json(
          { error: "Daily login reward already claimed" },
          { status: 400 }
        );
      }
      throw completionError;
    }

    const { data: newBalance, error: coinError } = await supabase.rpc(
      "add_coins",
      {
        p_user_id: profile.id,
        p_amount: config.coin_rewards.daily_login,
        p_type: "daily_login",
        p_description: "Daily login bonus",
      }
    );

    if (coinError) throw coinError;

    await supabase
      .from("profiles")
      .update({ last_daily_login: today })
      .eq("id", profile.id);

    return NextResponse.json({
      coinsEarned: config.coin_rewards.daily_login,
      newBalance,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("not approved") || message.includes("blocked")
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
