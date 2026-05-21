import { format } from "date-fns";
import type { AIContext, WorkoutDataset } from "./types";
import { exerciseProgressSeries } from "./chart-series";
import {
  detectPRs,
  overviewStats,
  topExercisesByVolume,
} from "./metrics";

export function buildAIContext(
  dataset: WorkoutDataset,
  userMessage: string,
  exerciseName?: string
): AIContext {
  const stats = overviewStats(dataset);
  const prs = detectPRs(dataset, 15);

  const context: AIContext = {
    dateRange: {
      start: format(dataset.dateRange.start, "yyyy-MM-dd"),
      end: format(dataset.dateRange.end, "yyyy-MM-dd"),
    },
    totalSessions: dataset.sessions.length,
    sessionsLast4Weeks: stats.sessionsLast4Weeks,
    volumeLast4Weeks: stats.volumeLast4Weeks,
    volumePrior4Weeks: stats.volumePrior4Weeks,
    volumeChangePercent: Math.round(stats.volumeChangePercent * 10) / 10,
    workoutsPerWeekAvg:
      Math.round(stats.workoutsPerWeekAvg * 100) / 100,
    topExercisesByVolume: topExercisesByVolume(dataset, 4, 10),
    recentPRs: prs.map((p) => ({
      exercise: p.exercise,
      metric: p.metric,
      value: p.value,
      date: format(p.date, "yyyy-MM-dd"),
    })),
    userMessage,
  };

  if (exerciseName) {
    const series = exerciseProgressSeries(dataset, exerciseName, "max");
    context.exerciseTrends = [
      {
        name: exerciseName,
        maxWeightSeries: series.map(
          (p) => [p.date, p.maxWeight] as [string, number]
        ),
      },
    ];
  }

  return context;
}
