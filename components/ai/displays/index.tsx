"use client";

import type { ChatDisplay } from "@/lib/ai/display";
import { ExerciseChartDisplay } from "./exercise-chart";
import { WorkoutPlanDisplay } from "./workout-plan";
import { StatHighlightDisplay } from "./stat-highlight";
import { SessionListDisplay } from "./session-list";
import { DisplayPlaceholder } from "./placeholder";

function renderOne(display: ChatDisplay): React.ReactNode {
  switch (display.kind) {
    case "exercise_chart":
      return <ExerciseChartDisplay {...display} />;
    case "workout_plan":
      return <WorkoutPlanDisplay {...display} />;
    case "stat_highlight":
      return <StatHighlightDisplay {...display} />;
    case "session_list":
      return <SessionListDisplay {...display} />;
    default: {
      // Exhaustiveness check — if a new kind is added the compiler will warn here.
      const _exhaustive: never = display;
      void _exhaustive;
      return (
        <DisplayPlaceholder>Couldn&apos;t render component.</DisplayPlaceholder>
      );
    }
  }
}

export function ChatDisplays({ displays }: { displays: ChatDisplay[] }) {
  if (!displays || displays.length === 0) return null;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {displays.map((d, i) => (
        <div key={i}>{renderOne(d)}</div>
      ))}
    </div>
  );
}
