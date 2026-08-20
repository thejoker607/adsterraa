"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Play,
  PlusCircle,
  Megaphone,
  Wallet,
  Crown,
  User,
  Menu,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-slate-900">AdPromo</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {coinBalance !== undefined && (
            <div className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200 sm:flex">
              <Wallet className="h-4 w-4" />
              {coinBalance.toLocaleString()} coins
            </div>
          )}
          <button
            onClick={handleLogout}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 sm:flex"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <nav className="hidden border-t border-slate-100 lg:block">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
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

      {mobileOpen && (
        <nav className="border-t border-slate-100 bg-white lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
