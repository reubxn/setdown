"use client";

import { useAuth } from "@/context/auth-context";
import { PageShell } from "@/components/layout/page-shell";
import { AccountSection } from "@/components/settings/account-section";
import { DataSection } from "@/components/settings/data-section";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { ExportSection } from "@/components/settings/export-section";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <PageShell title="Settings" subtitle="Account, data, and preferences">
      <div className="grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        {isAuthenticated && user && (
          <div className="lg:col-span-2">
            <AccountSection user={user} />
          </div>
        )}
        <DataSection isAuthenticated={isAuthenticated} />
        <PreferencesSection />
        {isAuthenticated && <ExportSection isAuthenticated={isAuthenticated} />}
        {!isAuthenticated && !isLoading && (
          <div className="rounded-md border border-dashed border-[var(--border-subtle)] p-4 text-sm text-[var(--text-muted)] lg:col-span-1">
            Sign in to manage your account and export your data.
          </div>
        )}
      </div>
    </PageShell>
  );
}
