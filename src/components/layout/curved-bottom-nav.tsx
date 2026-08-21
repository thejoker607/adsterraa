"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Play,
  PlusCircle,
  Megaphone,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_COLOR = "#4687FD";
const BAR_HEIGHT = 56;
const BUMP_RADIUS = 26;
const BUMP_GUTTER = 18;

/** Runner is the center (3rd) tab — the curved bump target. */
const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/promotions/create", label: "Create", icon: PlusCircle },
  { href: "/runner", label: "Runner", icon: Play },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/profile", label: "Profile", icon: User },
];

function getActiveIndex(pathname: string): number {
  const idx = navItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return idx >= 0 ? idx : 0;
}

function buildBarPath(width: number, activeIndex: number): string {
  const tabWidth = width / navItems.length;
  const cx = tabWidth * activeIndex + tabWidth / 2;
  const barLine = 14;
  const left = cx - BUMP_RADIUS - BUMP_GUTTER;
  const right = cx + BUMP_RADIUS + BUMP_GUTTER;

  return [
    `M 0 ${BAR_HEIGHT}`,
    `L 0 ${barLine}`,
    `L ${Math.max(0, left)} ${barLine}`,
    `C ${left + 10} ${barLine} ${cx - BUMP_RADIUS} ${barLine} ${cx - BUMP_RADIUS} ${barLine + 10}`,
    `A ${BUMP_RADIUS} ${BUMP_RADIUS} 0 0 0 ${cx + BUMP_RADIUS} ${barLine + 10}`,
    `C ${cx + BUMP_RADIUS} ${barLine} ${right - 10} ${barLine} ${Math.min(width, right)} ${barLine}`,
    `L ${width} ${barLine}`,
    `L ${width} ${BAR_HEIGHT}`,
    `Z`,
  ].join(" ");
}

export function CurvedBottomNav() {
  const pathname = usePathname();
  const activeIndex = getActiveIndex(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(390);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => setWidth(node.offsetWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const tabWidth = width / navItems.length;

  return (
    <nav
      className="curved-bottom-nav fixed inset-x-0 bottom-0 z-50 lg:hidden"
      aria-label="Main navigation"
    >
      <div
        ref={containerRef}
        className="relative mx-auto h-[88px] max-w-lg overflow-visible bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      >
        {/* Colored bar with smooth animated dip */}
        <svg
          className="absolute inset-x-0 top-0 h-[56px] w-full transition-none"
          viewBox={`0 0 ${width} ${BAR_HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={buildBarPath(width, activeIndex)}
            fill={NAV_COLOR}
            className="transition-[d] duration-300 ease-out"
          />
        </svg>

        {/* Tab buttons */}
        <div className="absolute inset-x-0 top-0 flex h-[88px]">
          {navItems.map((item, index) => {
            const active = index === activeIndex;
            const Icon = item.icon;
            const center = tabWidth * index + tabWidth / 2;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="relative flex-1"
                style={{ width: `${100 / navItems.length}%` }}
              >
                <span
                  className={cn(
                    "absolute flex items-center justify-center transition-all duration-300 ease-out",
                    active
                      ? "h-[45px] w-[45px] -translate-x-1/2 -translate-y-1/2 text-white"
                      : "h-8 w-8 -translate-x-1/2 text-slate-900"
                  )}
                  style={{
                    left: center,
                    top: active ? 30 : 24,
                  }}
                >
                  <Icon
                    className={cn(
                      "transition-all duration-300 ease-out",
                      active ? "h-[25px] w-[25px]" : "h-[30px] w-[30px]"
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                </span>
                {!active && (
                  <span
                    className="absolute -translate-x-1/2 text-[10px] font-medium leading-none text-slate-600"
                    style={{ left: center, top: 54 }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
