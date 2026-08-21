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
const BAR_LINE = 14;
const BUMP_RADIUS = 28;
const BUMP_GUTTER = 16;
const NAV_HEIGHT = 96;

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

/** Blue shape = top strip + downward bump only (white below on the sides). */
function buildBarPath(width: number, activeIndex: number): string {
  const tabWidth = width / navItems.length;
  const cx = tabWidth * activeIndex + tabWidth / 2;
  const left = cx - BUMP_RADIUS - BUMP_GUTTER;
  const right = cx + BUMP_RADIUS + BUMP_GUTTER;

  return [
    `M 0 0`,
    `L ${width} 0`,
    `L ${width} ${BAR_LINE}`,
    `L ${Math.min(width, right)} ${BAR_LINE}`,
    `C ${right - 8} ${BAR_LINE} ${cx + BUMP_RADIUS} ${BAR_LINE} ${cx + BUMP_RADIUS} ${BAR_LINE + 8}`,
    `A ${BUMP_RADIUS} ${BUMP_RADIUS} 0 0 1 ${cx - BUMP_RADIUS} ${BAR_LINE + 8}`,
    `C ${cx - BUMP_RADIUS} ${BAR_LINE} ${left + 8} ${BAR_LINE} ${Math.max(0, left)} ${BAR_LINE}`,
    `L 0 ${BAR_LINE}`,
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
  const svgHeight = BAR_LINE + BUMP_RADIUS + 12;

  return (
    <nav
      className="curved-bottom-nav fixed inset-x-0 bottom-0 z-50 lg:hidden"
      aria-label="Main navigation"
    >
      <div
        ref={containerRef}
        className="relative mx-auto overflow-visible bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ height: NAV_HEIGHT }}
      >
        {/* Top blue strip + bump (sides stay white below the strip) */}
        <svg
          className="absolute inset-x-0 top-0 w-full"
          style={{ height: svgHeight }}
          viewBox={`0 0 ${width} ${svgHeight}`}
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d={buildBarPath(width, activeIndex)} fill={NAV_COLOR} />
        </svg>

        {/* Tab buttons */}
        <div
          className="absolute inset-x-0 top-0 z-10"
          style={{ height: NAV_HEIGHT }}
        >
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
                className="absolute bottom-0 top-0"
                style={{
                  left: center,
                  width: tabWidth,
                  transform: "translateX(-50%)",
                }}
              >
                {/* Active: lifted white icon in the bump; inactive: on the blue strip */}
                <span
                  className={cn(
                    "absolute left-1/2 flex -translate-x-1/2 items-center justify-center rounded-full transition-all duration-300 ease-out",
                    active
                      ? "h-[45px] w-[45px] text-white"
                      : "h-8 w-8 text-slate-900"
                  )}
                  style={{ top: active ? 2 : 22 }}
                >
                  <Icon
                    className={cn(
                      "shrink-0 transition-all duration-300 ease-out",
                      active ? "h-[25px] w-[25px]" : "h-[26px] w-[26px]"
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                </span>

                {/* Labels for inactive tabs — sit on white area below the blue strip */}
                {!active && (
                  <span className="absolute left-1/2 top-[62px] -translate-x-1/2 whitespace-nowrap text-[10px] font-medium leading-none text-slate-600">
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
