import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ users: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-users:${ip}`, 60, 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { userId, action, value } = body as {
      userId: string;
      action: string;
      value?: unknown;
    };

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = createAdminClient();
    let update: Record<string, unknown> = {};

    switch (action) {
      case "approve": {
        update = { account_status: "approved" };

        const { data: approvedUser } = await supabase
          .from("profiles")
          .select("referred_by")
          .eq("id", userId)
          .single();

        if (approvedUser?.referred_by) {
          const { data: configRows } = await supabase
            .from("platform_config")
            .select("value")
            .eq("key", "coin_rewards")
            .single();

          const referralReward =
            (configRows?.value as { referral?: number })?.referral ?? 50;
          const refKey = `referral_${userId}`;

          const { error: refError } = await supabase
            .from("task_completions")
            .insert({
              user_id: approvedUser.referred_by,
              task_type: "referral",
              reference_key: refKey,
              coins_earned: referralReward,
            });

          if (!refError) {
            await supabase.rpc("add_coins", {
              p_user_id: approvedUser.referred_by,
              p_amount: referralReward,
              p_type: "referral",
              p_description: "Referral bonus",
              p_reference_id: userId,
            });
          }
        }
        break;
      }
      case "reject":
        update = { account_status: "rejected" };
        break;
      case "block":
        update = { account_status: "blocked" };
        break;
      case "unblock":
        update = { account_status: "approved" };
        break;
      case "premium_tier1":
        update = { premium_tier: "tier1" };
        break;
      case "premium_tier2":
        update = { premium_tier: "tier2" };
        break;
      case "premium_free":
        update = { premium_tier: "free" };
        break;
      case "adjust_coins": {
        const amount = Number(value);
        const reason = (body as { reason?: string }).reason || "Admin adjustment";
        if (!amount || amount === 0) {
          return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }
        if (amount > 0) {
          await supabase.rpc("add_coins", {
            p_user_id: userId,
            p_amount: amount,
            p_type: "admin_adjustment",
            p_description: reason,
          });
        } else {
          await supabase.rpc("deduct_coins", {
            p_user_id: userId,
            p_amount: Math.abs(amount),
            p_type: "admin_adjustment",
            p_description: reason,
          });
        }
        await logAudit(admin.adminId, "adjust_coins", "user", userId, {
          amount,
          reason,
        });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", userId);

    if (error) throw error;

    await logAudit(admin.adminId, action, "user", userId, update);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
