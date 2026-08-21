"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runner", label: "Runner", icon: Play },
  { href: "/promotions/create", label: "Create", icon: PlusCircle },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/profile", label: "Profile", icon: User },
];

function getActiveIndex(pathname: string): number {
  const idx = navItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  return idx >= 0 ? idx : 0;
}

function tabCenterPercent(index: number): string {
  return `${(2 * index + 1) * 10}%`;
}

export function CurvedBottomNav() {
  const pathname = usePathname();
  const activeIndex = getActiveIndex(pathname);
  const bubbleLeft = `calc(${tabCenterPercent(activeIndex)} - 22.5px)`;

  return (
    <nav
      className="curved-bottom-nav fixed inset-x-0 bottom-0 z-50 bg-white lg:hidden"
      aria-label="Main navigation"
    >
      <div className="relative mx-auto h-[88px] max-w-lg">
        {/* Primary bar */}
        <div
          className="absolute inset-x-0 bottom-[38px] h-[52px] shadow-lg"
          style={{ backgroundColor: NAV_COLOR }}
        />

        {/* Sliding curved notch */}
        <div
          className="curved-bottom-nav__slider pointer-events-none absolute bottom-0 transition-[left] duration-300 ease-out"
          style={{ left: bubbleLeft }}
        >
          <div
            className="absolute bottom-[71px] right-[61.8px] h-[45px] w-[45px] rounded-full"
            style={{ backgroundColor: NAV_COLOR }}
          />
          <div className="absolute bottom-0 right-[100px] h-[100px] w-[200vw] rounded-[40px] bg-white" />
          <div className="absolute bottom-0 -right-[343px] h-[100px] w-[200vw] rounded-[40px] bg-white" />
        </div>

        {/* Tab buttons */}
        <div className="absolute inset-x-0 bottom-0 flex h-[88px] items-end justify-around px-1 pb-5">
          {navItems.map((item, index) => {
            const active = index === activeIndex;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="relative flex w-1/5 flex-col items-center justify-end"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ease-out",
                    active ? "-translate-y-7" : "translate-y-0"
                  )}
                  style={active ? { backgroundColor: NAV_COLOR } : undefined}
                >
                  <Icon
                    className={cn(
                      "transition-all duration-300 ease-out",
                      active ? "h-[25px] w-[25px] text-white" : "h-[30px] w-[30px] text-slate-900"
                    )}
                    strokeWidth={active ? 2 : 1.75}
                  />
                </span>
                <span
                  className={cn(
                    "mt-1 text-[10px] font-medium transition-opacity duration-200",
                    active ? "opacity-0" : "text-slate-600 opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
