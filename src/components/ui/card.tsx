import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Card({
  children,
  className,
  title,
  description,
  action,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-slate-900">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
