import { NextResponse } from "next/server";
import { requireApprovedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { profile } = await requireApprovedUser();
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: session } = await supabase
      .from("runner_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", profile.id)
      .eq("status", "active")
      .single();

    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 404 });
    }

    await supabase
      .from("runner_sessions")
      .update({ last_heartbeat_at: new Date().toISOString() })
      .eq("id", sessionId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}

export async function DELETE(request: Request) {
  return abandonSession(request);
}

export async function PUT(request: Request) {
  return abandonSession(request);
}

async function abandonSession(request: Request) {
  try {
    const { profile } = await requireApprovedUser();
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: session } = await supabase
      .from("runner_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", profile.id)
      .eq("status", "active")
      .single();

    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 404 });
    }

    await supabase
      .from("runner_session_tasks")
      .update({ status: "incomplete" })
      .eq("session_id", sessionId)
      .eq("status", "in_progress");

    await supabase
      .from("runner_sessions")
      .update({ status: "abandoned", completed_at: new Date().toISOString() })
      .eq("id", sessionId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}
