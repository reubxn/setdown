export type SetType = "warmup" | "working" | "dropset" | "failure" | "unknown";

export interface WorkoutSet {
  id: string;
  date: Date;
  workoutName: string;
  durationMinutes: number | null;
  exerciseName: string;
  setOrder: string;
  setType: SetType;
  setIndex: number | null;
  weight: number;
  reps: number;
  distance: number;
  seconds: number;
  rpe: number | null;
  volume: number;
}

export interface WorkoutSession {
  id: string;
  date: Date;
  workoutName: string;
  durationMinutes: number | null;
  sets: WorkoutSet[];
  totalVolume: number;
  exerciseCount: number;
}

export interface WorkoutDataset {
  importedAt: string;
  fileName: string;
  sessions: WorkoutSession[];
  exercises: string[];
  dateRange: { start: Date; end: Date };
}

export interface AIContext {
  dateRange: { start: string; end: string };
  totalSessions: number;
  sessionsLast4Weeks: number;
  volumeLast4Weeks: number;
  volumePrior4Weeks: number;
  volumeChangePercent: number;
  workoutsPerWeekAvg: number;
  topExercisesByVolume: { name: string; volume: number }[];
  recentPRs: {
    exercise: string;
    metric: string;
    value: number;
    date: string;
  }[];
  exerciseTrends?: { name: string; maxWeightSeries: [string, number][] }[];
  userMessage: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
