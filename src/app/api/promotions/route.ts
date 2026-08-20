import { NextResponse } from "next/server";
import {
  requireApprovedUser,
  getPlatformConfig,
  getCooldownMinutes,
  isCooldownActive,
} from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { promotionSchema } from "@/lib/validation/schemas";
import { calculateCampaignCost } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    const { profile } = await requireApprovedUser();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("promotions")
      .select("*, campaigns(*)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ promotions: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`promotion:${ip}`, 20, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { profile } = await requireApprovedUser();
    const body = await request.json();
    const parsed = promotionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const config = await getPlatformConfig();
    const supabase = createAdminClient();
    const { title, description, url, targetImpressions } = parsed.data;
    const coinCost = calculateCampaignCost(
      targetImpressions,
      config.campaign_pricing.coins_per_100_impressions
    );

    if (profile.coin_balance < coinCost) {
      return NextResponse.json(
        { error: `Insufficient coins. Need ${coinCost}, have ${profile.coin_balance}` },
        { status: 400 }
      );
    }

    const cooldownMinutes = getCooldownMinutes(profile.premium_tier, config.cooldowns);

    const { data: recentCampaigns } = await supabase
      .from("campaigns")
      .select("last_started_at, promotion_id")
      .eq("user_id", profile.id)
      .order("last_started_at", { ascending: false })
      .limit(10);

    const samePromotionCooldown = recentCampaigns?.find(
      (c) =>
        c.last_started_at &&
        isCooldownActive(c.last_started_at, cooldownMinutes)
    );

    if (samePromotionCooldown && cooldownMinutes > 0) {
      return NextResponse.json(
        {
          error: `Campaign cooldown active. Wait ${cooldownMinutes} minutes between restarting the same promotion.`,
        },
        { status: 400 }
      );
    }

    const { data: promotion, error: promoError } = await supabase
      .from("promotions")
      .insert({
        user_id: profile.id,
        title,
        description: description || null,
        url,
        status: "pending",
      })
      .select()
      .single();

    if (promoError) throw promoError;

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        promotion_id: promotion.id,
        user_id: profile.id,
        target_impressions: targetImpressions,
        coin_cost: coinCost,
        status: "pending",
        last_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    await supabase.rpc("deduct_coins", {
      p_user_id: profile.id,
      p_amount: coinCost,
      p_type: "campaign_spend",
      p_description: `Campaign: ${title}`,
      p_reference_id: campaign.id,
    });

    return NextResponse.json({ promotion, campaign, coinCost });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
