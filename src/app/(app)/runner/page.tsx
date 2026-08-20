"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/states";
import { ExternalLink, Play, AlertTriangle } from "lucide-react";

interface Promotion {
  title: string;
  url: string;
  description: string | null;
}

interface RunnerTask {
  id: string;
  order_index: number;
  status: string;
  required_view_seconds: number;
  reward_coins: number;
  promotions: Promotion;
}

interface RunnerSession {
  id: string;
  session_size: number;
  current_index: number;
  status: string;
}

export default function RunnerPage() {
  const [session, setSession] = useState<RunnerSession | null>(null);
  const [tasks, setTasks] = useState<RunnerTask[]>([]);
  const [currentTask, setCurrentTask] = useState<RunnerTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [viewDuration, setViewDuration] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [sessionSize, setSessionSize] = useState<20 | 30 | 60>(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadSession = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/runner");
    const data = await res.json();
    setLoading(false);

    if (data.session) {
      setSession(data.session);
      setTasks(data.tasks || []);
      const active = data.tasks?.find(
        (t: RunnerTask) => t.status === "in_progress"
      );
      setCurrentTask(active || null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!session?.id) return;

    heartbeatRef.current = setInterval(() => {
      fetch("/api/runner/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
    }, 15000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [session?.id]);

  useEffect(() => {
    const handleLeave = () => {
      if (session?.id && session.status === "active") {
        fetch("/api/runner/session", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id }),
          keepalive: true,
        });
      }
    };

    window.addEventListener("beforeunload", handleLeave);
    return () => {
      window.removeEventListener("beforeunload", handleLeave);
      handleLeave();
    };
  }, [session]);

  useEffect(() => {
    if (!currentTask || currentTask.status !== "in_progress") return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync timer state to new task
    setCountdown(currentTask.required_view_seconds);
    setViewDuration(0);

    timerRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    viewTimerRef.current = setInterval(() => {
      setViewDuration((v) => v + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (viewTimerRef.current) clearInterval(viewTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset timers when task changes
  }, [currentTask?.id, currentTask?.status, currentTask?.required_view_seconds]);

  async function startSession() {
    setStarting(true);
    setError("");
    const res = await fetch("/api/runner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionSize }),
    });
    const data = await res.json();
    setStarting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSession(data.session);
    setTasks(data.tasks);
    setCurrentTask(
      data.tasks.find((t: RunnerTask) => t.status === "in_progress") || data.tasks[0]
    );
  }

  async function completeTask() {
    if (!currentTask || !session) return;
    setCompleting(true);
    setError("");

    const res = await fetch("/api/runner/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: currentTask.id,
        sessionId: session.id,
        viewDuration,
      }),
    });

    const data = await res.json();
    setCompleting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    if (data.sessionComplete) {
      setSession(null);
      setTasks([]);
      setCurrentTask(null);
      setError("");
      alert(`Session complete! You earned coins for completed views.`);
      return;
    }

    if (data.nextTask) {
      setCurrentTask(data.nextTask);
      setSession((s) =>
        s ? { ...s, current_index: data.nextTask.order_index } : s
      );
    }
  }

  async function abandonSession() {
    if (!session) return;
    await fetch("/api/runner/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    });
    setSession(null);
    setTasks([]);
    setCurrentTask(null);
  }

  if (loading) return <LoadingSpinner />;

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  if (!session) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Runner</h1>
          <p className="text-slate-600">
            View clearly labeled user promotions one at a time. Earn coins for
            completing legitimate view sessions.
          </p>
        </div>

        <Card title="Start a Session">
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            Leaving this page during a session marks the current task incomplete
            with no reward.
          </div>

          {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

          <p className="mb-3 text-sm font-medium text-slate-700">Session size</p>
          <div className="mb-6 grid grid-cols-3 gap-3">
            {([20, 30, 60] as const).map((size) => (
              <button
                key={size}
                onClick={() => setSessionSize(size)}
                className={`rounded-lg border-2 px-4 py-3 text-center font-semibold transition-colors ${
                  sessionSize === size
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {size}
                <span className="block text-xs font-normal text-slate-500">
                  promotions
                </span>
              </button>
            ))}
          </div>

          <Button onClick={startSession} loading={starting} className="w-full">
            <Play className="h-4 w-4" />
            Start Runner Session
          </Button>
        </Card>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <EmptyState
        title="No current task"
        description="Your session may have ended."
        action={
          <Button onClick={() => { setSession(null); loadSession(); }}>
            Back to Runner
          </Button>
        }
      />
    );
  }

  const promo = currentTask.promotions;
  const canComplete = countdown === 0 && viewDuration >= currentTask.required_view_seconds;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Runner</h1>
          <p className="text-sm text-slate-600">
            Promotion {currentTask.order_index + 1} of {tasks.length}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={abandonSession}>
          End Session
        </Button>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {error && <ErrorMessage message={error} />}

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="warning">Sponsored Promotion</Badge>
          <Badge variant="info">+{currentTask.reward_coins} coins on completion</Badge>
        </div>

        <h2 className="text-xl font-bold text-slate-900">{promo.title}</h2>
        {promo.description && (
          <p className="mt-2 text-slate-600">{promo.description}</p>
        )}

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Promotional Link
          </p>
          <a
            href={promo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-2 text-indigo-600 hover:underline break-all"
          >
            {promo.url}
            <ExternalLink className="h-4 w-4 shrink-0" />
          </a>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold tabular-nums text-indigo-600">
              {countdown}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              seconds remaining (view for {currentTask.required_view_seconds}s)
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={completeTask}
            disabled={!canComplete}
            loading={completing}
            className="flex-1"
          >
            {canComplete ? "Complete & Next" : "Keep Viewing..."}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Do not refresh or leave this page. Incomplete tasks receive no reward.
        </p>
      </Card>
    </div>
  );
}
