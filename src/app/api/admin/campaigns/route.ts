import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth/admin";
import { getOrCreatePlatformProfileId } from "@/lib/auth/platform";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminPromotionSchema } from "@/lib/validation/schemas";

const ADMIN_PUBLISHED_NOTE = "[admin-published]";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        promotions (title, url, description),
        profiles (email, full_name)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ campaigns: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = adminPromotionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { title, description, url, targetImpressions } = parsed.data;
    const supabase = createAdminClient();
    const platformUserId = await getOrCreatePlatformProfileId();

    const { data: promotion, error: promoError } = await supabase
      .from("promotions")
      .insert({
        user_id: platformUserId,
        title,
        description: description || null,
        url,
        status: "active",
      })
      .select()
      .single();

    if (promoError) throw promoError;

    const campaignPayload = {
      promotion_id: promotion.id,
      user_id: platformUserId,
      target_impressions: targetImpressions,
      coin_cost: 0,
      status: "active",
      last_started_at: new Date().toISOString(),
      admin_notes: ADMIN_PUBLISHED_NOTE,
    };

    let { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert(campaignPayload)
      .select()
      .single();

    if (campaignError) {
      const retry = await supabase
        .from("campaigns")
        .insert({ ...campaignPayload, coin_cost: 1 })
        .select()
        .single();
      campaign = retry.data;
      campaignError = retry.error;
    }

    if (campaignError || !campaign) throw campaignError ?? new Error("Failed to create campaign");

    await logAudit(admin.adminId, "campaign_publish", "campaign", campaign.id, {
      title,
      url,
      targetImpressions,
      coinCost: 0,
    });

    return NextResponse.json({ promotion, campaign });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const { campaignId, action, notes } = await request.json();

    if (!campaignId || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = createAdminClient();
    let update: Record<string, unknown> = {};

    switch (action) {
      case "approve":
        update = { status: "active", admin_notes: notes || null };
        await supabase
          .from("promotions")
          .update({ status: "active" })
          .eq(
            "id",
            (
              await supabase
                .from("campaigns")
                .select("promotion_id")
                .eq("id", campaignId)
                .single()
            ).data?.promotion_id || ""
          );
        break;
      case "reject":
        update = { status: "rejected", admin_notes: notes || null };
        break;
      case "pause":
        update = { status: "cancelled" };
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const { error } = await supabase
      .from("campaigns")
      .update(update)
      .eq("id", campaignId);

    if (error) throw error;

    await logAudit(admin.adminId, `campaign_${action}`, "campaign", campaignId, {
      notes,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
