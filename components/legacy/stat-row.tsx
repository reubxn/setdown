import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatRow({
  icon: Icon,
  label,
  value,
  trend,
  sparkline,
}: {
  icon?: LucideIcon;
  label: string;
  value: string;
  trend?: { direction: "up" | "down" | "neutral"; text: string };
  sparkline?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 py-3 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <Icon className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" strokeWidth={1.5} />
        )}
        <span className="text-xs font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase truncate">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {sparkline}
        <span className="text-sm font-semibold text-white tabular-nums">{value}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.direction === "up" && "text-[var(--accent-green)]",
              trend.direction === "down" && "text-[var(--accent-red)]",
              trend.direction === "neutral" && "text-[var(--text-muted)]"
            )}
          >
            {trend.text}
          </span>
        )}
      </div>
    </div>
  );
}
