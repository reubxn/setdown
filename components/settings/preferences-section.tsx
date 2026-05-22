"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";

const STORAGE_KEY = "setdown-preferences-v1";

type Units = "kg" | "lb";
type WeekStart = "mon" | "sun";

interface Preferences {
  units: Units;
  weekStart: WeekStart;
}

const DEFAULTS: Preferences = {
  units: "kg",
  weekStart: "mon",
};

function load(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export function PreferencesSection() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  return (
    <Card>
      <CardHeader title="Preferences" subtitle="Display and unit options" />
      <CardBody>
        <div className="space-y-5">
          <Row label="Units">
            <SegmentedControl<Units>
              size="sm"
              value={prefs.units}
              onChange={(v) => setPrefs((p) => ({ ...p, units: v }))}
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
              onChange={(v) => setPrefs((p) => ({ ...p, weekStart: v }))}
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
