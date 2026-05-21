/**
 * Static mapping of common exercise names to muscle groups.
 *
 * Each entry: primary + secondary muscle groups.
 * Groups roll up into 5 high-level buckets used by the balance chart:
 *   push | pull | legs | core | arms
 *
 * Lookup is case-insensitive, ignores parens/qualifiers, and falls back to
 * keyword sniffing if a name isn't in the table.
 */

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "cardio"
  | "other";

export type Bucket = "push" | "pull" | "legs" | "core" | "arms" | "other";

export interface MuscleAssignment {
  primary: MuscleGroup;
  secondary: MuscleGroup[];
}

export const BUCKETS: Bucket[] = ["push", "pull", "legs", "core", "arms"];

export const GROUP_TO_BUCKET: Record<MuscleGroup, Bucket> = {
  chest: "push",
  shoulders: "push",
  triceps: "arms",
  back: "pull",
  biceps: "arms",
  forearms: "arms",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  core: "core",
  cardio: "other",
  other: "other",
};

/**
 * Manually curated mapping of ~200 common exercises.
 * Keys are lowercased and stripped of parenthetical qualifiers (see `normalizeName`).
 */
const TABLE: Record<string, MuscleAssignment> = {
  // ─── chest ─────────────────────────────────────────────
  "bench press": { primary: "chest", secondary: ["triceps", "shoulders"] },
  "barbell bench press": { primary: "chest", secondary: ["triceps", "shoulders"] },
  "dumbbell bench press": { primary: "chest", secondary: ["triceps", "shoulders"] },
  "incline bench press": { primary: "chest", secondary: ["triceps", "shoulders"] },
  "incline barbell bench press": { primary: "chest", secondary: ["triceps", "shoulders"] },
  "incline dumbbell bench press": { primary: "chest", secondary: ["triceps", "shoulders"] },
  "decline bench press": { primary: "chest", secondary: ["triceps"] },
  "decline barbell bench press": { primary: "chest", secondary: ["triceps"] },
  "decline dumbbell bench press": { primary: "chest", secondary: ["triceps"] },
  "close grip bench press": { primary: "triceps", secondary: ["chest"] },
  "floor press": { primary: "chest", secondary: ["triceps"] },
  "push up": { primary: "chest", secondary: ["triceps", "shoulders", "core"] },
  "push-up": { primary: "chest", secondary: ["triceps", "shoulders", "core"] },
  pushup: { primary: "chest", secondary: ["triceps", "shoulders", "core"] },
  "diamond push up": { primary: "triceps", secondary: ["chest"] },
  "incline push up": { primary: "chest", secondary: ["shoulders"] },
  "decline push up": { primary: "chest", secondary: ["shoulders"] },
  "chest fly": { primary: "chest", secondary: [] },
  "dumbbell fly": { primary: "chest", secondary: [] },
  "incline dumbbell fly": { primary: "chest", secondary: [] },
  "cable fly": { primary: "chest", secondary: [] },
  "cable crossover": { primary: "chest", secondary: [] },
  "pec deck": { primary: "chest", secondary: [] },
  "machine chest press": { primary: "chest", secondary: ["triceps", "shoulders"] },
  "machine fly": { primary: "chest", secondary: [] },
  dips: { primary: "chest", secondary: ["triceps"] },
  "chest dip": { primary: "chest", secondary: ["triceps"] },
  "tricep dip": { primary: "triceps", secondary: ["chest"] },

  // ─── back ──────────────────────────────────────────────
  deadlift: { primary: "back", secondary: ["hamstrings", "glutes", "forearms"] },
  "conventional deadlift": { primary: "back", secondary: ["hamstrings", "glutes"] },
  "sumo deadlift": { primary: "glutes", secondary: ["back", "hamstrings"] },
  "romanian deadlift": { primary: "hamstrings", secondary: ["glutes", "back"] },
  "stiff leg deadlift": { primary: "hamstrings", secondary: ["glutes", "back"] },
  "trap bar deadlift": { primary: "back", secondary: ["quads", "glutes"] },
  "rack pull": { primary: "back", secondary: ["forearms"] },
  "good morning": { primary: "hamstrings", secondary: ["back", "glutes"] },
  "pull up": { primary: "back", secondary: ["biceps"] },
  "pull-up": { primary: "back", secondary: ["biceps"] },
  pullup: { primary: "back", secondary: ["biceps"] },
  "chin up": { primary: "back", secondary: ["biceps"] },
  "chin-up": { primary: "back", secondary: ["biceps"] },
  chinup: { primary: "back", secondary: ["biceps"] },
  "neutral grip pull up": { primary: "back", secondary: ["biceps"] },
  "weighted pull up": { primary: "back", secondary: ["biceps"] },
  "assisted pull up": { primary: "back", secondary: ["biceps"] },
  "lat pulldown": { primary: "back", secondary: ["biceps"] },
  "wide grip lat pulldown": { primary: "back", secondary: ["biceps"] },
  "close grip lat pulldown": { primary: "back", secondary: ["biceps"] },
  "neutral grip lat pulldown": { primary: "back", secondary: ["biceps"] },
  "straight arm pulldown": { primary: "back", secondary: [] },
  "barbell row": { primary: "back", secondary: ["biceps", "forearms"] },
  "bent over row": { primary: "back", secondary: ["biceps"] },
  "bent over barbell row": { primary: "back", secondary: ["biceps"] },
  "pendlay row": { primary: "back", secondary: ["biceps"] },
  "yates row": { primary: "back", secondary: ["biceps"] },
  "dumbbell row": { primary: "back", secondary: ["biceps"] },
  "single arm dumbbell row": { primary: "back", secondary: ["biceps"] },
  "one arm dumbbell row": { primary: "back", secondary: ["biceps"] },
  "seated cable row": { primary: "back", secondary: ["biceps"] },
  "cable row": { primary: "back", secondary: ["biceps"] },
  "t bar row": { primary: "back", secondary: ["biceps"] },
  "t-bar row": { primary: "back", secondary: ["biceps"] },
  "chest supported row": { primary: "back", secondary: ["biceps"] },
  "machine row": { primary: "back", secondary: ["biceps"] },
  "inverted row": { primary: "back", secondary: ["biceps"] },
  shrug: { primary: "back", secondary: [] },
  "barbell shrug": { primary: "back", secondary: [] },
  "dumbbell shrug": { primary: "back", secondary: [] },
  "face pull": { primary: "shoulders", secondary: ["back"] },
  "rear delt fly": { primary: "shoulders", secondary: ["back"] },
  "reverse fly": { primary: "shoulders", secondary: ["back"] },
  hyperextension: { primary: "back", secondary: ["glutes", "hamstrings"] },
  "back extension": { primary: "back", secondary: ["glutes", "hamstrings"] },

  // ─── shoulders ─────────────────────────────────────────
  "overhead press": { primary: "shoulders", secondary: ["triceps"] },
  "military press": { primary: "shoulders", secondary: ["triceps"] },
  "shoulder press": { primary: "shoulders", secondary: ["triceps"] },
  "seated shoulder press": { primary: "shoulders", secondary: ["triceps"] },
  "dumbbell shoulder press": { primary: "shoulders", secondary: ["triceps"] },
  "barbell shoulder press": { primary: "shoulders", secondary: ["triceps"] },
  "arnold press": { primary: "shoulders", secondary: ["triceps"] },
  "push press": { primary: "shoulders", secondary: ["triceps", "quads"] },
  "machine shoulder press": { primary: "shoulders", secondary: ["triceps"] },
  "lateral raise": { primary: "shoulders", secondary: [] },
  "side lateral raise": { primary: "shoulders", secondary: [] },
  "dumbbell lateral raise": { primary: "shoulders", secondary: [] },
  "cable lateral raise": { primary: "shoulders", secondary: [] },
  "front raise": { primary: "shoulders", secondary: [] },
  "dumbbell front raise": { primary: "shoulders", secondary: [] },
  "upright row": { primary: "shoulders", secondary: ["back"] },

  // ─── biceps ────────────────────────────────────────────
  "bicep curl": { primary: "biceps", secondary: ["forearms"] },
  "barbell curl": { primary: "biceps", secondary: ["forearms"] },
  "ez bar curl": { primary: "biceps", secondary: ["forearms"] },
  "ez-bar curl": { primary: "biceps", secondary: ["forearms"] },
  "dumbbell curl": { primary: "biceps", secondary: ["forearms"] },
  "alternating dumbbell curl": { primary: "biceps", secondary: ["forearms"] },
  "hammer curl": { primary: "biceps", secondary: ["forearms"] },
  "preacher curl": { primary: "biceps", secondary: [] },
  "incline dumbbell curl": { primary: "biceps", secondary: [] },
  "concentration curl": { primary: "biceps", secondary: [] },
  "cable curl": { primary: "biceps", secondary: ["forearms"] },
  "spider curl": { primary: "biceps", secondary: [] },
  "21s": { primary: "biceps", secondary: [] },
  "machine curl": { primary: "biceps", secondary: [] },
  "reverse curl": { primary: "forearms", secondary: ["biceps"] },

  // ─── triceps ───────────────────────────────────────────
  "tricep extension": { primary: "triceps", secondary: [] },
  "triceps extension": { primary: "triceps", secondary: [] },
  "tricep pushdown": { primary: "triceps", secondary: [] },
  "triceps pushdown": { primary: "triceps", secondary: [] },
  "cable pushdown": { primary: "triceps", secondary: [] },
  "rope pushdown": { primary: "triceps", secondary: [] },
  "overhead tricep extension": { primary: "triceps", secondary: [] },
  "skull crusher": { primary: "triceps", secondary: [] },
  "lying tricep extension": { primary: "triceps", secondary: [] },
  "french press": { primary: "triceps", secondary: [] },
  "tricep kickback": { primary: "triceps", secondary: [] },

  // ─── forearms ──────────────────────────────────────────
  "wrist curl": { primary: "forearms", secondary: [] },
  "reverse wrist curl": { primary: "forearms", secondary: [] },
  "farmers walk": { primary: "forearms", secondary: ["core"] },
  "farmer carry": { primary: "forearms", secondary: ["core"] },
  "dead hang": { primary: "forearms", secondary: [] },

  // ─── quads ─────────────────────────────────────────────
  squat: { primary: "quads", secondary: ["glutes", "hamstrings"] },
  "back squat": { primary: "quads", secondary: ["glutes", "hamstrings"] },
  "barbell squat": { primary: "quads", secondary: ["glutes", "hamstrings"] },
  "front squat": { primary: "quads", secondary: ["glutes", "core"] },
  "goblet squat": { primary: "quads", secondary: ["glutes"] },
  "high bar squat": { primary: "quads", secondary: ["glutes"] },
  "low bar squat": { primary: "quads", secondary: ["glutes", "hamstrings"] },
  "box squat": { primary: "quads", secondary: ["glutes", "hamstrings"] },
  "pause squat": { primary: "quads", secondary: ["glutes"] },
  "bulgarian split squat": { primary: "quads", secondary: ["glutes"] },
  "split squat": { primary: "quads", secondary: ["glutes"] },
  lunge: { primary: "quads", secondary: ["glutes"] },
  "walking lunge": { primary: "quads", secondary: ["glutes"] },
  "reverse lunge": { primary: "quads", secondary: ["glutes"] },
  "leg press": { primary: "quads", secondary: ["glutes", "hamstrings"] },
  "hack squat": { primary: "quads", secondary: ["glutes"] },
  "leg extension": { primary: "quads", secondary: [] },
  "sissy squat": { primary: "quads", secondary: [] },
  "step up": { primary: "quads", secondary: ["glutes"] },
  "step-up": { primary: "quads", secondary: ["glutes"] },

  // ─── hamstrings ────────────────────────────────────────
  "leg curl": { primary: "hamstrings", secondary: [] },
  "lying leg curl": { primary: "hamstrings", secondary: [] },
  "seated leg curl": { primary: "hamstrings", secondary: [] },
  "nordic curl": { primary: "hamstrings", secondary: [] },
  "glute ham raise": { primary: "hamstrings", secondary: ["glutes"] },

  // ─── glutes ────────────────────────────────────────────
  "hip thrust": { primary: "glutes", secondary: ["hamstrings"] },
  "barbell hip thrust": { primary: "glutes", secondary: ["hamstrings"] },
  "glute bridge": { primary: "glutes", secondary: ["hamstrings"] },
  "cable kickback": { primary: "glutes", secondary: [] },
  "hip abduction": { primary: "glutes", secondary: [] },
  "hip adduction": { primary: "glutes", secondary: [] },

  // ─── calves ────────────────────────────────────────────
  "calf raise": { primary: "calves", secondary: [] },
  "standing calf raise": { primary: "calves", secondary: [] },
  "seated calf raise": { primary: "calves", secondary: [] },
  "calf press": { primary: "calves", secondary: [] },
  "donkey calf raise": { primary: "calves", secondary: [] },

  // ─── core ──────────────────────────────────────────────
  plank: { primary: "core", secondary: [] },
  "side plank": { primary: "core", secondary: [] },
  crunch: { primary: "core", secondary: [] },
  "cable crunch": { primary: "core", secondary: [] },
  "sit up": { primary: "core", secondary: [] },
  "sit-up": { primary: "core", secondary: [] },
  situp: { primary: "core", secondary: [] },
  "leg raise": { primary: "core", secondary: [] },
  "hanging leg raise": { primary: "core", secondary: [] },
  "knee raise": { primary: "core", secondary: [] },
  "hanging knee raise": { primary: "core", secondary: [] },
  "ab wheel": { primary: "core", secondary: [] },
  "ab rollout": { primary: "core", secondary: [] },
  "russian twist": { primary: "core", secondary: [] },
  "wood chop": { primary: "core", secondary: [] },
  "cable woodchop": { primary: "core", secondary: [] },
  "dead bug": { primary: "core", secondary: [] },
  "bird dog": { primary: "core", secondary: [] },
  "hollow hold": { primary: "core", secondary: [] },
  "mountain climber": { primary: "core", secondary: [] },
  "toes to bar": { primary: "core", secondary: [] },

  // ─── cardio ────────────────────────────────────────────
  running: { primary: "cardio", secondary: [] },
  treadmill: { primary: "cardio", secondary: [] },
  cycling: { primary: "cardio", secondary: [] },
  rowing: { primary: "cardio", secondary: [] },
  "rowing machine": { primary: "cardio", secondary: [] },
  elliptical: { primary: "cardio", secondary: [] },
  jumprope: { primary: "cardio", secondary: [] },
  "jump rope": { primary: "cardio", secondary: [] },
  burpee: { primary: "cardio", secondary: ["core"] },
};

/**
 * Strip qualifiers, normalize whitespace, lowercase.
 * "Bench Press (Barbell)" → "bench press"
 * "Squat - Back" → "squat back"
 */
export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[_\-/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const KEYWORD_FALLBACKS: { match: RegExp; assign: MuscleAssignment }[] = [
  { match: /bench|chest press|fly|pec/, assign: { primary: "chest", secondary: ["triceps"] } },
  { match: /pull[- ]?up|chin[- ]?up|pulldown|row\b/, assign: { primary: "back", secondary: ["biceps"] } },
  { match: /deadlift|good morning|hyperextension|back extension/, assign: { primary: "back", secondary: ["hamstrings", "glutes"] } },
  { match: /squat|lunge|leg press|hack/, assign: { primary: "quads", secondary: ["glutes"] } },
  { match: /leg curl|nordic|stiff leg/, assign: { primary: "hamstrings", secondary: [] } },
  { match: /hip thrust|glute|hip abduct|hip adduct/, assign: { primary: "glutes", secondary: [] } },
  { match: /calf/, assign: { primary: "calves", secondary: [] } },
  { match: /shoulder|overhead press|military|arnold|lateral raise|front raise|delt/, assign: { primary: "shoulders", secondary: ["triceps"] } },
  { match: /curl/, assign: { primary: "biceps", secondary: ["forearms"] } },
  { match: /tricep|triceps|pushdown|skull crusher/, assign: { primary: "triceps", secondary: [] } },
  { match: /wrist|forearm|grip/, assign: { primary: "forearms", secondary: [] } },
  { match: /plank|crunch|sit ?up|ab |abs\b|core|leg raise|russian twist/, assign: { primary: "core", secondary: [] } },
  { match: /run|tread|cycl|bike|elliptical|row\b machine|jump rope/, assign: { primary: "cardio", secondary: [] } },
  { match: /push[- ]?up|dip/, assign: { primary: "chest", secondary: ["triceps"] } },
];

const UNKNOWN: MuscleAssignment = { primary: "other", secondary: [] };

/**
 * Look up muscle groups for an exercise name.
 * Falls back to keyword sniffing, then to "other".
 */
export function lookupMuscles(exerciseName: string): MuscleAssignment {
  const norm = normalizeName(exerciseName);
  if (TABLE[norm]) return TABLE[norm];

  for (const { match, assign } of KEYWORD_FALLBACKS) {
    if (match.test(norm)) return assign;
  }
  return UNKNOWN;
}

export function bucketOf(name: string): Bucket {
  return GROUP_TO_BUCKET[lookupMuscles(name).primary];
}
