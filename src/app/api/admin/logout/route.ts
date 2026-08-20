import { NextResponse } from "next/server";
import { clearAdminSession, getAdminSession, logAudit } from "@/lib/auth/admin";

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    await logAudit(session.adminId, "admin_logout");
  }
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
