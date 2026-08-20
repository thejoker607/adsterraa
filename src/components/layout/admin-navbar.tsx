"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/config", label: "Configuration", icon: Settings },
  { href: "/admin/account", label: "Account", icon: UserCircle },
];

export function AdminNavbar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return (
      pathname === href ||
      (href !== "/admin" && pathname.startsWith(href))
    );
  }

  const navLinks = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {adminNav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 px-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <Shield className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <span className="block text-sm font-bold text-slate-900">AdPromo Admin</span>
        <p className="truncate text-xs text-slate-500">{adminName}</p>
      </div>
    </div>
  );

  const logoutButton = (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );

  return (
    <>
      <aside className="safe-top fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200">
          {brand}
        </div>
        <div className="flex flex-1 flex-col py-4">{navLinks}</div>
        <div className="border-t border-slate-200 p-3">{logoutButton}</div>
      </aside>

      <header className="safe-top sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:hidden">
        {brand}
        <button
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="safe-top relative flex h-full w-64 flex-col border-r border-slate-200 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 pr-2">
              {brand}
              <button
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col py-4">{navLinks}</div>
            <div className="border-t border-slate-200 p-3">{logoutButton}</div>
          </aside>
        </div>
      )}
    </>
  );
}
