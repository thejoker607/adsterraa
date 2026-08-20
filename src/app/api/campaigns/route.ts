import { NextResponse } from "next/server";
import { requireApprovedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { profile } = await requireApprovedUser();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("campaigns")
      .select(
        `
        *,
        promotions (id, title, description, url, status)
      `
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ campaigns: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}
