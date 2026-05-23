"use client";

import { useAuth } from "@/context/auth-context";
import { SlideOver } from "@/components/ui/slide-over";
import { AccountSection } from "@/components/settings/account-section";
import { DataSection } from "@/components/settings/data-section";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { ExportSection } from "@/components/settings/export-section";

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Settings"
      description="Account, data, and preferences"
      width="lg"
    >
      <div className="flex flex-col gap-6">
        {isAuthenticated && user && <AccountSection user={user} />}
        <DataSection isAuthenticated={isAuthenticated} />
        <PreferencesSection />
        {isAuthenticated && <ExportSection isAuthenticated={isAuthenticated} />}
        {!isAuthenticated && !isLoading && (
          <div className="rounded-md border border-dashed border-[var(--border-subtle)] p-4 text-sm text-[var(--text-muted)]">
            Sign in to manage your account and export your data.
          </div>
        )}
      </div>
    </SlideOver>
  );
}
