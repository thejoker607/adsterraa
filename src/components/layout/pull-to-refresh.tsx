"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { dispatchAppRefresh } from "@/lib/app-refresh";
import { cn } from "@/lib/utils";

const THRESHOLD = 72;
const MAX_PULL = 128;
const MIN_SPINNER_MS = 700;

function scrollTop() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function canStartPull(target: EventTarget | null) {
  if (document.querySelector("[data-no-pull-refresh]")) return false;
  if (scrollTop() > 2) return false;
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-no-pull-refresh]")) return false;
  return true;
}

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const pullRef = useRef(0);
  const refreshingRef = useRef(false);
  const pullingRef = useRef(false);
  const startYRef = useRef(0);
  const timeoutRef = useRef<number>(0);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    const setPullBoth = (value: number) => {
      pullRef.current = value;
      setPull(value);
    };

    const onStart = (event: TouchEvent) => {
      if (refreshingRef.current || !canStartPull(event.target)) {
        pullingRef.current = false;
        return;
      }
      pullingRef.current = true;
      startYRef.current = event.touches[0].clientY;
    };

    const onMove = (event: TouchEvent) => {
      if (!pullingRef.current || refreshingRef.current) return;
      if (scrollTop() > 2) {
        pullingRef.current = false;
        setPullBoth(0);
        return;
      }

      const delta = event.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        setPullBoth(0);
        return;
      }

      event.preventDefault();
      const damped = Math.min(MAX_PULL, delta * 0.42);
      setPullBoth(damped);
    };

    const onEnd = () => {
      if (!pullingRef.current) return;
      pullingRef.current = false;

      if (refreshingRef.current) return;

      if (pullRef.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullBoth(THRESHOLD);
        dispatchAppRefresh();
        startTransition(() => {
          router.refresh();
        });
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullBoth(0);
        }, MIN_SPINNER_MS);
      } else {
        setPullBoth(0);
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);

    return () => {
      window.clearTimeout(timeoutRef.current);
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, [router, startTransition]);

  const visible = refreshing || pull > 6;
  const armed = refreshing || pull >= THRESHOLD;

  return (
    <>
      <div
        className="pull-refresh-indicator pointer-events-none fixed inset-x-0 z-[200] flex justify-center"
        aria-hidden={!visible}
      >
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-slate-200/80 transition-opacity duration-150",
            visible ? "opacity-100" : "opacity-0"
          )}
          style={{
            transform: `translateY(${Math.max(0, pull * 0.35)}px)`,
          }}
        >
          <div
            className={cn(
              "h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent",
              armed && "animate-spin"
            )}
            style={
              armed
                ? undefined
                : { transform: `rotate(${pull * 2.8}deg)` }
            }
          />
        </div>
      </div>
      {children}
    </>
  );
}
