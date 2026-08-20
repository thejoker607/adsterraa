import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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
