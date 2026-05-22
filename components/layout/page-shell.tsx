import { cn } from "@/lib/utils";

/** Shared page width + padding for dashboard routes */
export const pageContainerClass =
  "mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8";

export function PageShell({
  title,
  subtitle,
  children,
  className,
  headerExtra,
}: {
  title?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerExtra?: React.ReactNode;
}) {
  return (
    <div className={cn(pageContainerClass, className)}>
      {(title || subtitle || headerExtra) && (
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            {title && (
              <h1 className="font-display text-3xl lg:text-4xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--text-muted)] lg:text-base">
                {subtitle}
              </p>
            )}
          </div>
          {headerExtra}
        </header>
      )}
      {children}
    </div>
  );
}

/** Responsive grid for chart cards */
export function ChartGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 xl:gap-8",
        className
      )}
    >
      {children}
    </div>
  );
}
