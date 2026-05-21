import { cn } from "@/lib/utils";

export function PrimaryButton({
  children,
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline-green" | "destructive";
}) {
  return (
    <button
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
        variant === "default" && "bg-white text-black hover:bg-white/90",
        variant === "outline-green" &&
          "border border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green)]/10",
        variant === "destructive" &&
          "border border-[var(--accent-red)]/50 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
