import { cn } from "@/lib/utils";

const variants = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  premium: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: keyof typeof variants }> =
    {
      pending: { label: "Pending", variant: "warning" },
      approved: { label: "Approved", variant: "success" },
      rejected: { label: "Rejected", variant: "danger" },
      blocked: { label: "Blocked", variant: "danger" },
      active: { label: "Active", variant: "info" },
      completed: { label: "Completed", variant: "success" },
      cancelled: { label: "Cancelled", variant: "default" },
      draft: { label: "Draft", variant: "default" },
      paused: { label: "Paused", variant: "warning" },
    };
  const item = map[status] || { label: status, variant: "default" as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
