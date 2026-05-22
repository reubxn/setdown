"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  buildHeatmapData,
  buildExerciseHeatmapData,
  type HeatmapEntry,
} from "@/lib/derive/body-heatmap";
import { colors } from "@/lib/design-tokens";
import type { WorkoutDataset, WorkoutSet } from "@/lib/types";

const Model = dynamic(() => import("react-body-highlighter"), { ssr: false });

type View = "anterior" | "posterior";

const HIGHLIGHT_RAMP = [
  "rgba(29, 78, 216, 0.20)",
  "rgba(29, 78, 216, 0.40)",
  "rgba(29, 78, 216, 0.60)",
  "rgba(29, 78, 216, 0.80)",
  colors.accent,
];

interface CommonProps {
  title?: string;
  subtitle?: string;
  maxWidth?: number;
}

interface DatasetProps extends CommonProps {
  dataset: WorkoutDataset;
  exerciseNames?: never;
  sets?: never;
}

interface SetsProps extends CommonProps {
  sets: WorkoutSet[];
  dataset?: never;
  exerciseNames?: never;
}

interface ExerciseProps extends CommonProps {
  exerciseNames: string[];
  dataset?: never;
  sets?: never;
}

type Props = DatasetProps | SetsProps | ExerciseProps;

export function BodyHeatmap(props: Props) {
  const [view, setView] = useState<View>("anterior");

  const data = useMemo<HeatmapEntry[]>(() => {
    if ("exerciseNames" in props && props.exerciseNames) {
      return buildExerciseHeatmapData(props.exerciseNames);
    }
    if ("sets" in props && props.sets) {
      return buildHeatmapData({ sets: props.sets });
    }
    if ("dataset" in props && props.dataset) {
      return buildHeatmapData({
        sets: props.dataset.sessions.flatMap((s) => s.sets),
      });
    }
    return [];
  }, [props]);

  const maxWidth = props.maxWidth ?? 340;

  return (
    <Card>
      <CardHeader
        title={props.title ?? "Muscle map"}
        subtitle={props.subtitle}
        action={
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v as View)}
            options={[
              { value: "anterior", label: "Front" },
              { value: "posterior", label: "Back" },
            ]}
            size="sm"
          />
        }
      />
      <CardBody>
        {data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-[var(--text-muted)]">
            No muscles to show.
          </div>
        ) : (
          <div className="flex justify-center">
            <Model
              data={data}
              type={view}
              bodyColor="var(--bg-sunken)"
              highlightedColors={HIGHLIGHT_RAMP}
              style={{ width: "100%", maxWidth, padding: 8 }}
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
