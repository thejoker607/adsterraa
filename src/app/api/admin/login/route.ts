import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAdminSession,
  verifyPassword,
  logAudit,
} from "@/lib/auth/admin";
import { adminLoginSchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: admin } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", parsed.data.email)
      .eq("is_active", true)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(parsed.data.password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createAdminSession({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
    });

    await logAudit(admin.id, "admin_login");

    return NextResponse.json({ name: admin.name });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
