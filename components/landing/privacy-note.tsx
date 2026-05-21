import { Lock } from "lucide-react";

export function PrivacyNote() {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-6 py-12">
      <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-sunken)] text-[var(--accent)]">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-medium text-[var(--text-primary)]">
            Your data, your device
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your data lives on your device. Sign in only if you want to save it
            across devices or chat with AI.
          </p>
        </div>
      </div>
    </section>
  );
}
