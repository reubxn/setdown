"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { buildHeatmapData } from "@/lib/derive/body-heatmap";
import { colors } from "@/lib/design-tokens";
import type { WorkoutDataset } from "@/lib/types";

const Model = dynamic(() => import("react-body-highlighter"), { ssr: false });

type View = "anterior" | "posterior";

const HIGHLIGHT_RAMP = [
  "rgba(29, 78, 216, 0.20)",
  "rgba(29, 78, 216, 0.40)",
  "rgba(29, 78, 216, 0.60)",
  "rgba(29, 78, 216, 0.80)",
  colors.accent,
];

export function BodyHeatmap({ dataset }: { dataset: WorkoutDataset }) {
  const [view, setView] = useState<View>("anterior");
  const sets = useMemo(
    () => dataset.sessions.flatMap((s) => s.sets),
    [dataset.sessions],
  );
  const data = useMemo(() => buildHeatmapData({ sets }), [sets]);

  return (
    <Card>
      <CardHeader
        title="Muscle map"
        subtitle="Volume by muscle group across the loaded range"
        action={
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v as View)}
            options={[
              { value: "anterior", label: "Front" },
              { value: "posterior", label: "Back" },
            ]}
          />
        }
      />
      <CardBody>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-[var(--text-muted)]">
            No data to show.
          </div>
        ) : (
          <div className="flex justify-center">
            <Model
              data={data}
              type={view}
              bodyColor="var(--bg-sunken)"
              highlightedColors={HIGHLIGHT_RAMP}
              style={{ width: "100%", maxWidth: 340, padding: 8 }}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
