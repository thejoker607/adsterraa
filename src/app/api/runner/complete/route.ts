import { NextResponse } from "next/server";
import { requireApprovedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionFingerprint, rateLimit, getClientIp } from "@/lib/rate-limit";
import { hashFingerprint } from "@/lib/utils";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`runner-complete:${ip}`, 120, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { profile } = await requireApprovedUser();
    const { taskId, sessionId, viewDuration } = await request.json();

    if (!taskId || !sessionId || viewDuration === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const fingerprint = hashFingerprint(getSessionFingerprint(request));

    const { data: session } = await supabase
      .from("runner_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", profile.id)
      .eq("status", "active")
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not active. Task marked incomplete." },
        { status: 400 }
      );
    }

    const { data: task } = await supabase
      .from("runner_session_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("session_id", sessionId)
      .single();

    if (!task || task.status !== "in_progress") {
      return NextResponse.json({ error: "Task not in progress" }, { status: 400 });
    }

    if (viewDuration < task.required_view_seconds) {
      return NextResponse.json(
        {
          error: `View duration too short. Required: ${task.required_view_seconds}s`,
        },
        { status: 400 }
      );
    }

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*, promotions(url)")
      .eq("id", task.campaign_id)
      .single();

    if (!campaign || campaign.user_id === profile.id) {
      return NextResponse.json(
        { error: "Cannot complete own promotion" },
        { status: 403 }
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentViews } = await supabase
      .from("campaign_impressions")
      .select("id")
      .eq("campaign_id", task.campaign_id)
      .eq("viewer_id", profile.id)
      .gte("created_at", oneHourAgo)
      .eq("is_valid", true);

    if (recentViews && recentViews.length > 0) {
      await supabase
        .from("runner_session_tasks")
        .update({ status: "incomplete" })
        .eq("id", taskId);

      return NextResponse.json(
        { error: "Duplicate view detected. No reward awarded." },
        { status: 400 }
      );
    }

    const referenceKey = `runner_${taskId}`;

    const { error: completionError } = await supabase
      .from("task_completions")
      .insert({
        user_id: profile.id,
        task_type: "runner_view",
        reference_key: referenceKey,
        coins_earned: task.reward_coins,
      });

    if (completionError) {
      if (completionError.code === "23505") {
        return NextResponse.json(
          { error: "Task already completed" },
          { status: 400 }
        );
      }
      throw completionError;
    }

    await supabase.from("campaign_impressions").insert({
      campaign_id: task.campaign_id,
      viewer_id: profile.id,
      runner_session_id: sessionId,
      session_fingerprint: fingerprint,
      is_valid: true,
      view_duration_seconds: viewDuration,
    });

    const newImpressions = campaign.current_impressions + 1;
    const campaignUpdate: Record<string, unknown> = {
      current_impressions: newImpressions,
    };

    if (newImpressions >= campaign.target_impressions) {
      campaignUpdate.status = "completed";
      await supabase
        .from("promotions")
        .update({ status: "completed" })
        .eq("id", task.promotion_id);
    }

    await supabase.from("campaigns").update(campaignUpdate).eq("id", task.campaign_id);

    const { data: newBalance } = await supabase.rpc("add_coins", {
      p_user_id: profile.id,
      p_amount: task.reward_coins,
      p_type: "runner_reward",
      p_description: "Runner session view reward",
      p_reference_id: taskId,
    });

    await supabase
      .from("runner_session_tasks")
      .update({
        status: "completed",
        view_duration_seconds: viewDuration,
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    const nextIndex = task.order_index + 1;
    const { data: nextTask } = await supabase
      .from("runner_session_tasks")
      .select(
        `
        *,
        promotions (title, url, description)
      `
      )
      .eq("session_id", sessionId)
      .eq("order_index", nextIndex)
      .maybeSingle();

    if (nextTask) {
      await supabase
        .from("runner_session_tasks")
        .update({
          status: "in_progress",
          started_at: new Date().toISOString(),
        })
        .eq("id", nextTask.id);

      await supabase
        .from("runner_sessions")
        .update({
          current_index: nextIndex,
          last_heartbeat_at: new Date().toISOString(),
          total_rewards_earned: session.total_rewards_earned + task.reward_coins,
        })
        .eq("id", sessionId);
    } else {
      await supabase
        .from("runner_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          total_rewards_earned: session.total_rewards_earned + task.reward_coins,
        })
        .eq("id", sessionId);
    }

    return NextResponse.json({
      coinsEarned: task.reward_coins,
      newBalance,
      nextTask: nextTask
        ? { ...nextTask, status: "in_progress" }
        : null,
      sessionComplete: !nextTask,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
