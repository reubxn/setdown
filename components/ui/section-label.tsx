import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-xs font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase",
        className
      )}
    >
      {children}
    </p>
  );
}
