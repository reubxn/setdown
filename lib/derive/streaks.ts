import { differenceInCalendarWeeks, startOfWeek } from "date-fns";
import type { WorkoutDataset } from "@/lib/types";

export interface StreakStats {
  currentWeeks: number;
  longestWeeks: number;
  totalActiveWeeks: number;
}

function uniqueActiveWeekKeys(dataset: WorkoutDataset): number[] {
  const set = new Set<number>();
  for (const s of dataset.sessions) {
    const w = startOfWeek(s.date, { weekStartsOn: 1 }).getTime();
    set.add(w);
  }
  return [...set].sort((a, b) => a - b);
}

export function computeStreaks(dataset: WorkoutDataset): StreakStats {
  const weeks = uniqueActiveWeekKeys(dataset);
  if (weeks.length === 0) {
    return { currentWeeks: 0, longestWeeks: 0, totalActiveWeeks: 0 };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < weeks.length; i++) {
    const gap = differenceInCalendarWeeks(
      new Date(weeks[i]),
      new Date(weeks[i - 1]),
      { weekStartsOn: 1 }
    );
    if (gap === 1) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const thisWeek = startOfWeek(dataset.dateRange.end, {
    weekStartsOn: 1,
  }).getTime();
  const lastActive = weeks[weeks.length - 1];
  const gapFromNow = differenceInCalendarWeeks(
    new Date(thisWeek),
    new Date(lastActive),
    { weekStartsOn: 1 }
  );

  let current = 0;
  if (gapFromNow <= 1) {
    current = 1;
    for (let i = weeks.length - 1; i > 0; i--) {
      const gap = differenceInCalendarWeeks(
        new Date(weeks[i]),
        new Date(weeks[i - 1]),
        { weekStartsOn: 1 }
      );
      if (gap === 1) current += 1;
      else break;
    }
  }

  return {
    currentWeeks: current,
    longestWeeks: longest,
    totalActiveWeeks: weeks.length,
  };
}
