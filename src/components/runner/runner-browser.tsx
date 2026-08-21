"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/states";
import { AlertTriangle, Globe, Loader2, Shield } from "lucide-react";

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

interface RunnerBrowserProps {
  tasks: RunnerTask[];
  currentTask: RunnerTask;
  countdown: number;
  viewDuration: number;
  progress: number;
  completing: boolean;
  error: string;
  onAbandon: () => void;
  onComplete: () => void;
}

export function RunnerBrowser({
  tasks,
  currentTask,
  countdown,
  viewDuration,
  progress,
  completing,
  error,
  onAbandon,
  onComplete,
}: RunnerBrowserProps) {
  const promo = currentTask.promotions;
  const frameKey = `${currentTask.id}:${promo.url}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const iframeError = errorKey === frameKey;
  const iframeLoading = loadedKey !== frameKey && !iframeError;

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const timerReady = countdown === 0 && viewDuration >= currentTask.required_view_seconds;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white" data-no-pull-refresh>
      <header className="shrink-0 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <Button variant="ghost" size="sm" onClick={onAbandon} className="shrink-0">
            End session
          </Button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs font-medium text-slate-500">
              Promotion {currentTask.order_index + 1} of {tasks.length}
            </p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="shrink-0 text-right">
            {completing ? (
              <Loader2 className="ml-auto h-5 w-5 animate-spin text-emerald-600" />
            ) : timerReady ? (
              <Button
                size="sm"
                onClick={onComplete}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                Done
              </Button>
            ) : (
              <div className="text-lg font-bold tabular-nums text-indigo-600">
                {countdown}s
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              {currentTask.required_view_seconds}s view
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
          <Globe className="h-4 w-4 shrink-0 text-slate-400" />
          <p className="truncate text-sm text-slate-600">{promo.url}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2">
          <Badge variant="warning">Sponsored</Badge>
          <Badge variant="info">+{currentTask.reward_coins} coins</Badge>
          <span className="truncate text-sm font-medium text-slate-800">{promo.title}</span>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden overscroll-none bg-slate-100">
        {iframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-sm text-slate-600">Loading promotion...</p>
          </div>
        )}

        {iframeError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <Shield className="h-10 w-10 text-amber-500" />
            <p className="font-medium text-slate-900">Could not load this page in the browser</p>
            <p className="max-w-sm text-sm text-slate-600">
              Keep this screen open. The view timer is still running.
            </p>
          </div>
        ) : (
          <iframe
            key={currentTask.id}
            src={promo.url}
            title={promo.title}
            className="h-full w-full border-0 bg-white [touch-action:pan-y]"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => setLoadedKey(frameKey)}
            onError={() => setErrorKey(frameKey)}
          />
        )}
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3">
        {error && (
          <div className="mb-3">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="text-slate-600">
            {completing
              ? "Moving to next promotion..."
              : timerReady
                ? "Tap Done to continue"
                : `Viewing ${viewDuration}s / ${currentTask.required_view_seconds}s`}
          </p>
          {timerReady && !completing ? (
            <Button size="sm" onClick={onComplete}>
              Done
            </Button>
          ) : (
            <p className="flex items-center gap-1 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              Stay on this screen
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
