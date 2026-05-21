import { cn } from "@/lib/utils";
import { SectionLabel } from "./section-label";

export function MetricCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[var(--card)] p-4",
        className
      )}
    >
      {title && (
        <SectionLabel className="mb-3">{title}</SectionLabel>
      )}
      {children}
    </div>
  );
}

export function InsightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--accent-blue)]/30 bg-[var(--card)]/80 p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
