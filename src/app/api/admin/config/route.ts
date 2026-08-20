import { NextResponse } from "next/server";
import { requireAdmin, logAudit } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { configUpdateSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("platform_config").select("*");
    if (error) throw error;
    return NextResponse.json({ config: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = configUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const updates = parsed.data;

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        await supabase
          .from("platform_config")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);
      }
    }

    await logAudit(admin.adminId, "update_config", "platform", undefined, updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { hashPassword } = await import("@/lib/auth/admin");
    const passwordHash = await hashPassword(password);
    const supabase = createAdminClient();

    const { error } = await supabase.from("admin_users").insert({
      email,
      password_hash: passwordHash,
      name,
    });

    if (error) throw error;

    await logAudit(admin.adminId, "create_admin", "admin", undefined, { email });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
