import { NextResponse } from "next/server";
import { requireApprovedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { profile } = await requireApprovedUser();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("coin_transactions")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ transactions: data, balance: profile.coin_balance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}
