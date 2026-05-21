import { format } from "date-fns";
import type { AIContext, WorkoutDataset } from "../types";
import { exerciseProgressSeries } from "../chart-series";
import {
  detectPRs,
  overviewStats,
  topExercisesByVolume,
} from "../metrics";

export interface PageScope {
  path?: string;
  exerciseName?: string;
}

export function buildAIContext(
  dataset: WorkoutDataset,
  userMessage: string,
  scope?: PageScope,
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
    workoutsPerWeekAvg: Math.round(stats.workoutsPerWeekAvg * 100) / 100,
    topExercisesByVolume: topExercisesByVolume(dataset, 4, 10),
    recentPRs: prs.map((p) => ({
      exercise: p.exercise,
      metric: p.metric,
      value: p.value,
      date: format(p.date, "yyyy-MM-dd"),
    })),
    userMessage,
  };

  const exerciseName = scope?.exerciseName ?? exerciseFromPath(scope?.path);
  if (exerciseName) {
    const matched =
      dataset.exercises.find(
        (e) => e.toLowerCase() === exerciseName.toLowerCase(),
      ) ?? exerciseName;
    const series = exerciseProgressSeries(dataset, matched, "max");
    context.exerciseTrends = [
      {
        name: matched,
        maxWeightSeries: series.map(
          (p) => [p.date, p.maxWeight] as [string, number],
        ),
      },
    ];
  }

  return context;
}

function exerciseFromPath(path?: string): string | undefined {
  if (!path) return undefined;
  const m = path.match(/\/exercises\/([^/?#]+)/);
  if (!m) return undefined;
  return decodeURIComponent(m[1]).replace(/-/g, " ");
}

export interface SuggestedPrompt {
  label: string;
  prompt: string;
}

export function suggestedPromptsForPath(path?: string): SuggestedPrompt[] {
  const exercise = exerciseFromPath(path);
  if (exercise) {
    return [
      {
        label: `Am I progressing on ${exercise}?`,
        prompt: `Am I progressing on ${exercise}? Look at weight, reps, and volume over time.`,
      },
      {
        label: "Plateau check",
        prompt: `Is ${exercise} plateauing? What would you change?`,
      },
      {
        label: "Programming tips",
        prompt: `Suggest a small programming tweak for ${exercise} based on my recent sets.`,
      },
    ];
  }
  if (path?.startsWith("/history")) {
    return [
      {
        label: "Recent session quality",
        prompt:
          "How have my last 5 sessions looked compared to my average?",
      },
      {
        label: "Volume trend",
        prompt: "What's my volume trend over the past 8 weeks?",
      },
      {
        label: "Skipped muscle groups",
        prompt: "Which muscle groups have I been neglecting?",
      },
    ];
  }
  return [
    {
      label: "Volume trend",
      prompt: "What's my volume trend over the past 8 weeks?",
    },
    {
      label: "Plateau risks",
      prompt: "Which lifts look like they're plateauing?",
    },
    {
      label: "What should I focus on?",
      prompt:
        "Based on my recent training, what should I focus on next?",
    },
  ];
}
