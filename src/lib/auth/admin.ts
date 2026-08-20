import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_COOKIE = "adpromo_admin_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "dev-admin-secret-change-me"
);

export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminSession(admin: AdminSession): Promise<string> {
  const token = await new SignJWT({
    adminId: admin.adminId,
    email: admin.email,
    name: admin.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return token;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, is_active")
    .eq("id", session.adminId)
    .single();

  if (!admin?.is_active) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function logAudit(
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, unknown>
) {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details ?? null,
  });
}
