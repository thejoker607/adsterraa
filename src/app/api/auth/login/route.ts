import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAdminSession,
  verifyPassword,
  logAudit,
  clearAdminSession,
} from "@/lib/auth/admin";
import { loginSchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const supabaseAdmin = createAdminClient();

    const { data: admin } = await supabaseAdmin
      .from("admin_users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .maybeSingle();

    if (admin) {
      const valid = await verifyPassword(password, admin.password_hash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const userSupabase = await createClient();
      await userSupabase.auth.signOut();

      await createAdminSession({
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
      });

      await logAudit(admin.id, "admin_login");

      return NextResponse.json({
        role: "admin",
        redirect: "/admin",
        name: admin.name,
      });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await clearAdminSession();

    return NextResponse.json({
      role: "user",
      redirect: "/dashboard",
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
