"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  usePreferences,
  type Units,
  type WeekStart,
} from "@/context/preferences-context";

export function PreferencesSection() {
  const { prefs, setUnits, setWeekStart } = usePreferences();

  return (
    <Card>
      <CardHeader title="Preferences" subtitle="Display and unit options" />
      <CardBody>
        <div className="space-y-5">
          <Row label="Units">
            <SegmentedControl<Units>
              size="sm"
              value={prefs.units}
              onChange={setUnits}
              options={[
                { value: "kg", label: "kg" },
                { value: "lb", label: "lb" },
              ]}
              aria-label="Weight units"
            />
          </Row>

          <Row label="Week starts on">
            <SegmentedControl<WeekStart>
              size="sm"
              value={prefs.weekStart}
              onChange={setWeekStart}
              options={[
                { value: "mon", label: "Mon" },
                { value: "sun", label: "Sun" },
              ]}
              aria-label="Week start day"
            />
          </Row>
        </div>
      </CardBody>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
      {children}
    </div>
  );
}
