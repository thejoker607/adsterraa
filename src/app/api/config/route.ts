import { NextResponse } from "next/server";
import { requireApprovedUser, getPlatformConfig } from "@/lib/auth/user";

export async function GET() {
  try {
    await requireApprovedUser();
    const config = await getPlatformConfig();
    return NextResponse.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
