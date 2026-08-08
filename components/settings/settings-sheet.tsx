"use client";

import { SlideOver } from "@/components/ui/slide-over";
import { DataSection } from "@/components/settings/data-section";
import { PreferencesSection } from "@/components/settings/preferences-section";

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Settings"
      description="Data and preferences"
      width="lg"
    >
      <div className="flex flex-col gap-6">
        <DataSection />
        <PreferencesSection />
      </div>
    </SlideOver>
  );
}
