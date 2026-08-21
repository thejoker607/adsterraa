"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Play,
  PlusCircle,
  Megaphone,
  Wallet,
  Crown,
  User,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runner", label: "Runner", icon: Play },
  { href: "/promotions/create", label: "Create Promotion", icon: PlusCircle },
  { href: "/campaigns", label: "My Campaigns", icon: Megaphone },
  { href: "/wallet", label: "Coin Wallet", icon: Wallet },
  { href: "/premium", label: "Premium", icon: Crown },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppNavbar({ coinBalance }: { coinBalance?: number }) {
  const pathname = usePathname();
  const premiumActive =
    pathname === "/premium" || pathname.startsWith("/premium/");

  if (pathname === "/dashboard") {
    return null;
  }

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-slate-900">AdPromo</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {coinBalance !== undefined && (
            <Link
              href="/wallet"
              className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200"
            >
              <Wallet className="h-4 w-4" />
              {coinBalance.toLocaleString()} coins
            </Link>
          )}
          <Link
            href="/premium"
            aria-label="Premium"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm sm:px-3",
              premiumActive
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Premium</span>
          </Link>
        </div>
      </div>

      <nav className="hidden border-t border-slate-100 lg:block">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
