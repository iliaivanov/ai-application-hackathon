import { z } from 'zod';
import type {
  ChefPersona,
  Pantry,
  RecipeCard,
  SeasonalBriefResult,
  WorkoutLog,
} from '@shared/types';

// Per SPEC §8: namespaced keys under awf:*. Corrupted entries → drop silently.

const STORAGE_KEYS = {
  pantry: 'awf:pantry',
  history: 'awf:history',
  lastPersona: 'awf:lastPersona',
  workoutLog: 'awf:workoutLog',
  seasonalBrief: 'awf:seasonalBrief',
} as const;

const pantryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['proteins', 'veg', 'grains', 'dairy', 'sauces', 'spices']),
  usageCount: z.number(),
  addedAt: z.number(),
});

const pantrySchema = z.object({
  items: z.array(pantryItemSchema),
  weirdDrawer: z.array(z.string()),
});

const personaSchema = z.enum([
  'michelin',
  'grandma',
  'gremlin',
  'host',
  'nutritionist',
]);

const macrosSchema = z.object({
  proteinG: z.number(),
  carbsG: z.number(),
  fatG: z.number(),
  kcal: z.number(),
});

const recipeSchema = z.object({
  id: z.string(),
  dishName: z.string(),
  intro: z.string(),
  ingredients: z.array(
    z.object({ name: z.string(), amount: z.string(), inPantry: z.boolean() }),
  ),
  steps: z.array(z.string()),
  macros: macrosSchema,
  workoutNote: z.string().optional(),
  shareableOneLiner: z.string().optional(),
  persona: personaSchema,
  createdAt: z.number(),
});

const workoutSchema = z.object({
  preset: z.enum(['weights', 'cardio', 'recovery', 'rest']).optional(),
  sport: z.string().optional(),
  durationMin: z.number().optional(),
  intensity: z.enum(['easy', 'moderate', 'hard', 'all-out']).optional(),
  freeText: z.string().optional(),
});

const seasonalSchema = z.object({
  brief: z.string(),
  fetchedAt: z.number(),
});

function read<T>(key: string, schema: z.ZodType<T>): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return schema.parse(JSON.parse(raw));
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or serialise error — best effort, no surfacing.
  }
}

export const storage = {
  loadPantry: (): Pantry | null => read(STORAGE_KEYS.pantry, pantrySchema),
  savePantry: (p: Pantry) => write(STORAGE_KEYS.pantry, p),

  loadHistory: (): RecipeCard[] => read(STORAGE_KEYS.history, z.array(recipeSchema)) ?? [],
  saveHistory: (h: RecipeCard[]) => write(STORAGE_KEYS.history, h.slice(-20)),

  loadLastPersona: (): ChefPersona | null => read(STORAGE_KEYS.lastPersona, personaSchema),
  saveLastPersona: (p: ChefPersona) => write(STORAGE_KEYS.lastPersona, p),

  loadWorkoutLog: (): WorkoutLog[] =>
    read(STORAGE_KEYS.workoutLog, z.array(workoutSchema)) ?? [],
  saveWorkoutLog: (log: WorkoutLog[]) =>
    write(STORAGE_KEYS.workoutLog, log.slice(-10)),

  loadSeasonalBrief: (): SeasonalBriefResult | null => {
    const v = read(STORAGE_KEYS.seasonalBrief, seasonalSchema);
    if (!v) return null;
    const TTL = 24 * 60 * 60 * 1000;
    if (Date.now() - v.fetchedAt > TTL) {
      localStorage.removeItem(STORAGE_KEYS.seasonalBrief);
      return null;
    }
    return v;
  },
  saveSeasonalBrief: (b: SeasonalBriefResult) => write(STORAGE_KEYS.seasonalBrief, b),
};
