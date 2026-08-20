import { NextResponse } from "next/server";
import { requireApprovedUser, getPlatformConfig } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { runnerStartSchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`runner-start:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { profile } = await requireApprovedUser();
    const body = await request.json();
    const parsed = runnerStartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session size" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const config = await getPlatformConfig();
    const sessionSize = parsed.data.sessionSize;

    const { data: activeSession } = await supabase
      .from("runner_sessions")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .maybeSingle();

    if (activeSession) {
      return NextResponse.json(
        { error: "You already have an active runner session" },
        { status: 400 }
      );
    }

    const { data: campaigns, error: campError } = await supabase
      .from("campaigns")
      .select(
        `
        id,
        promotion_id,
        user_id,
        target_impressions,
        current_impressions,
        promotions!inner (id, title, url, status)
      `
      )
      .eq("status", "active")
      .neq("user_id", profile.id)
      .filter("promotions.status", "eq", "active");

    if (campError) throw campError;

    const eligible = (campaigns || []).filter(
      (c) =>
        c.current_impressions < c.target_impressions &&
        c.user_id !== profile.id
    );

    if (eligible.length === 0) {
      return NextResponse.json(
        { error: "No approved promotions available right now" },
        { status: 404 }
      );
    }

    const shuffled = eligible.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, sessionSize);

    const { data: session, error: sessionError } = await supabase
      .from("runner_sessions")
      .insert({
        user_id: profile.id,
        session_size: sessionSize,
        status: "active",
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    const tasks = selected.map((camp, index) => ({
      session_id: session.id,
      campaign_id: camp.id,
      promotion_id: camp.promotion_id,
      order_index: index,
      required_view_seconds: config.runner.view_seconds,
      reward_coins: config.coin_rewards.runner_view,
      status: index === 0 ? "in_progress" : "pending",
      started_at: index === 0 ? new Date().toISOString() : null,
    }));

    const { data: createdTasks, error: taskError } = await supabase
      .from("runner_session_tasks")
      .insert(tasks)
      .select(
        `
        *,
        promotions (title, url, description)
      `
      );

    if (taskError) throw taskError;

    return NextResponse.json({
      session,
      tasks: createdTasks,
      totalTasks: createdTasks?.length || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function GET() {
  try {
    const { profile } = await requireApprovedUser();
    const supabase = createAdminClient();

    const { data: session } = await supabase
      .from("runner_sessions")
      .select("*")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ session: null, tasks: [] });
    }

    const { data: tasks } = await supabase
      .from("runner_session_tasks")
      .select(
        `
        *,
        promotions (title, url, description)
      `
      )
      .eq("session_id", session.id)
      .order("order_index");

    return NextResponse.json({ session, tasks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 403 });
  }
}
