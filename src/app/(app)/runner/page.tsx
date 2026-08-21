"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner, ErrorMessage, EmptyState } from "@/components/ui/states";
import { RunnerBrowser } from "@/components/runner/runner-browser";
import { AlertTriangle, Play } from "lucide-react";
import { useOnAppRefresh } from "@/lib/app-refresh";

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
  const [sessionCompleteMessage, setSessionCompleteMessage] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoCompletedRef = useRef<string | null>(null);
  const completingRef = useRef(false);
  const viewDurationRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStatusRef = useRef<string | null>(null);
  const leftIntentionallyRef = useRef(false);
  const leaveMountsRef = useRef(0);

  const loadSession = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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

  const refreshSession = useCallback(() => {
    if (document.querySelector("[data-no-pull-refresh]")) return;
    void loadSession(true);
  }, [loadSession]);

  useOnAppRefresh(refreshSession);

  useEffect(() => {
    sessionIdRef.current = session?.id ?? null;
    sessionStatusRef.current = session?.status ?? null;
  }, [session]);

  useEffect(() => {
    viewDurationRef.current = viewDuration;
  }, [viewDuration]);

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

  const abandonOnLeave = useCallback(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || sessionStatusRef.current !== "active") return;
    if (leftIntentionallyRef.current) return;
    leftIntentionallyRef.current = true;
    sessionStatusRef.current = "abandoned";
    fetch("/api/runner/session", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      keepalive: true,
    });
  }, []);

  useEffect(() => {
    let hideTimer: number | undefined;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hideTimer = window.setTimeout(() => abandonOnLeave(), 500);
      } else if (hideTimer) {
        window.clearTimeout(hideTimer);
        hideTimer = undefined;
      }
    };

    window.addEventListener("pagehide", abandonOnLeave);
    window.addEventListener("beforeunload", abandonOnLeave);
    document.addEventListener("visibilitychange", onVisibility);

    leaveMountsRef.current += 1;

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      window.removeEventListener("pagehide", abandonOnLeave);
      window.removeEventListener("beforeunload", abandonOnLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      leaveMountsRef.current -= 1;
      queueMicrotask(() => {
        if (leaveMountsRef.current === 0) abandonOnLeave();
      });
    };
  }, [abandonOnLeave]);

  useEffect(() => {
    if (!session?.id || session.status !== "active") return;

    const trapBack = () => {
      window.history.pushState({ runnerLock: true }, "", window.location.href);
    };
    trapBack();

    const onPopState = () => {
      trapBack();
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [session?.id, session?.status]);

  useEffect(() => {
    if (!currentTask || currentTask.status !== "in_progress") return;

    autoCompletedRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync timer state to new task
    setCountdown(currentTask.required_view_seconds);
    setViewDuration(0);
    viewDurationRef.current = 0;

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

  const completeTask = useCallback(async () => {
    if (!currentTask || !session || completingRef.current) return;
    completingRef.current = true;
    setCompleting(true);
    setError("");

    const res = await fetch("/api/runner/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: currentTask.id,
        sessionId: session.id,
        viewDuration: viewDurationRef.current,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      completingRef.current = false;
      setCompleting(false);
      autoCompletedRef.current = null;
      setError(data.error);
      return;
    }

    if (data.sessionComplete) {
      leftIntentionallyRef.current = true;
      sessionStatusRef.current = "completed";
      completingRef.current = false;
      setCompleting(false);
      setSession(null);
      setTasks([]);
      setCurrentTask(null);
      setError("");
      setSessionCompleteMessage(
        `Session complete! You earned coins for completed views.`
      );
      return;
    }

    if (data.nextTask) {
      autoCompletedRef.current = null;
      setCountdown(data.nextTask.required_view_seconds);
      setViewDuration(0);
      viewDurationRef.current = 0;
      setCurrentTask(data.nextTask);
      setSession((s) =>
        s ? { ...s, current_index: data.nextTask.order_index } : s
      );
      setTasks((prev) =>
        prev.map((task) =>
          task.id === currentTask.id
            ? { ...task, status: "completed" }
            : task.id === data.nextTask.id
              ? { ...task, status: "in_progress" }
              : task
        )
      );
      completingRef.current = false;
      setCompleting(false);
    }
  }, [currentTask, session]);

  useEffect(() => {
    if (!currentTask || currentTask.status !== "in_progress") return;
    if (countdown > 0 || completing) return;
    if (viewDuration < currentTask.required_view_seconds) return;
    if (autoCompletedRef.current === currentTask.id) return;

    autoCompletedRef.current = currentTask.id;
    void completeTask();
  }, [countdown, completing, currentTask, viewDuration, completeTask]);

  async function startSession() {
    setStarting(true);
    setError("");
    setSessionCompleteMessage("");
    leftIntentionallyRef.current = false;
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

  async function abandonSession() {
    if (!session) return;
    leftIntentionallyRef.current = true;
    sessionStatusRef.current = "abandoned";
    await fetch("/api/runner/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id }),
    });
    setSession(null);
    setTasks([]);
    setCurrentTask(null);
    setError("");
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
            View clearly labeled user promotions one at a time inside the app
            browser. Each link opens automatically and advances when the view
            time is complete.
          </p>
        </div>

        {sessionCompleteMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {sessionCompleteMessage}
          </div>
        )}

        <Card title="Start a Session">
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            Promotions open inside the app browser. Do not leave the runner
            screen during a session.
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

  return (
    <RunnerBrowser
      tasks={tasks}
      currentTask={currentTask}
      countdown={countdown}
      viewDuration={viewDuration}
      progress={progress}
      completing={completing}
      error={error}
      onAbandon={abandonSession}
      onComplete={completeTask}
    />
  );
}
