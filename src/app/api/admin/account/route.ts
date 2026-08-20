import { NextResponse } from "next/server";
import {
  requireAdmin,
  hashPassword,
  verifyPassword,
  createAdminSession,
  logAudit,
} from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminAccountUpdateSchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  try {
    const session = await requireAdmin();
    const supabase = createAdminClient();
    const { data: admin } = await supabase
      .from("admin_users")
      .select("id, email, name")
      .eq("id", session.adminId)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ admin });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`admin-account:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  try {
    const session = await requireAdmin();
    const body = await request.json();
    const parsed = adminAccountUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, currentPassword, newPassword } = parsed.data;
    const supabase = createAdminClient();

    const { data: admin } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", session.adminId)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    if (email && email !== admin.email) {
      const { data: existing } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", email)
        .neq("id", session.adminId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }

    const update: Record<string, string> = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (newPassword) {
      update.password_hash = await hashPassword(newPassword);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No changes to save" }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("admin_users")
      .update(update)
      .eq("id", session.adminId)
      .select("id, email, name")
      .single();

    if (error) throw error;

    await createAdminSession({
      adminId: updated.id,
      email: updated.email,
      name: updated.name,
    });

    await logAudit(session.adminId, "update_admin_account", "admin", session.adminId, {
      emailChanged: !!email && email !== admin.email,
      nameChanged: !!name && name !== admin.name,
      passwordChanged: !!newPassword,
    });

    return NextResponse.json({
      admin: updated,
      message: "Account updated successfully",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
