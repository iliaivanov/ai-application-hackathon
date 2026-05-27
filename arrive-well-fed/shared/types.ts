// shared/types.ts — single source of truth, imported by both client and server.
// Per SPEC §3: if your code needs a new field, add it here and tell the team.

export type PantryCategory =
  | 'proteins'
  | 'veg'
  | 'grains'
  | 'dairy'
  | 'sauces'
  | 'spices';

export interface PantryItem {
  id: string; // slug, e.g. "chicken-breast"
  name: string; // display, e.g. "Chicken breast"
  category: PantryCategory;
  usageCount: number; // incremented when used in an accepted recipe
  addedAt: number; // epoch ms
}

export interface Pantry {
  items: PantryItem[];
  weirdDrawer: string[]; // free-text items, e.g. ["gochujang", "miso paste"]
}

export type ChefPersona =
  | 'michelin'
  | 'grandma'
  | 'gremlin'
  | 'host'
  | 'nutritionist';

export type Mood =
  | 'energised'
  | 'tired'
  | 'stressed'
  | 'comfortable'
  | 'adventurous';

export type Intent =
  | 'fuel'
  | 'recover'
  | 'comfort'
  | 'quick'
  | 'adventurous';

export type WorkoutPreset = 'weights' | 'cardio' | 'recovery' | 'rest';
export type WorkoutIntensity = 'easy' | 'moderate' | 'hard' | 'all-out';

export interface WorkoutLog {
  preset?: WorkoutPreset;
  sport?: string;
  durationMin?: number;
  intensity?: WorkoutIntensity;
  freeText?: string;
}

// Output of AI call ② — the structured nutrition brief
export interface NutritionBrief {
  estimatedKcalBurn: number;
  macroPriority: 'protein-heavy' | 'carb-forward' | 'balanced' | 'light';
  recoveryWindowMin: number; // 0 if no workout
  notes: string; // 1–2 sentence brief for the chef
}

export interface RecipeIngredient {
  name: string;
  amount: string; // e.g. "200g", "2 tbsp", "a handful"
  inPantry: boolean; // ✅ vs 🛒
}

export interface RecipeMacros {
  proteinG: number;
  carbsG: number;
  fatG: number;
  kcal: number;
}

// The main recipe object — output of AI call ⑤ (and read by ⑥ tone switch, ⑧ one-liner)
export interface RecipeCard {
  id: string; // uuid
  dishName: string;
  intro: string; // 2–3 sentence persona-flavoured opener
  ingredients: RecipeIngredient[];
  steps: string[]; // numbered, written in persona voice
  macros: RecipeMacros;
  workoutNote?: string; // recovery tip, or pairing suggestion
  shareableOneLiner?: string; // populated by AI call ⑧
  persona: ChefPersona;
  createdAt: number;
}

export type DietaryTag = 'vegetarian' | 'gluten-free';

// Full request context passed to AI call ⑤ (recipe generation)
export interface RecipeContext {
  pantry: Pantry;
  persona: ChefPersona;
  mood: Mood;
  intent: Intent;
  nutritionBrief: NutritionBrief;
  seasonalBrief?: string; // from AI call ⑦
  surpriseMe?: {
    enabled: boolean;
    history: RecipeCard[];
  };
  dietary?: DietaryTag[]; // stretch
}

export interface SessionState {
  pantry: Pantry;
  history: RecipeCard[];
  currentRecipe: RecipeCard | null;
  selectedPersona: ChefPersona | null;
  mood: Mood | null;
  intent: Intent | null;
  workout: WorkoutLog | null;
}

// ---- API envelope (per SPEC §5, Eng 1 rule) ----
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ---- Call ① — Fridge vision ----
export interface FridgeScanRequest {
  imageBase64: string; // data URL or raw base64
  mimeType?: string; // default "image/jpeg"
}
export interface FridgeScanResult {
  items: { name: string; category: PantryCategory; confidence: number }[];
  weirdDrawer: string[];
}

// ---- Call ② — Workout brief ----
export interface WorkoutBriefRequest {
  workout: WorkoutLog;
}

// ---- Call ③ — Pantry gap ----
export interface PantryGapRequest {
  pantry: Pantry;
  history: RecipeCard[];
}
export interface PantryGapResult {
  ingredient: string;
  unlocks: number; // approx number of new dishes
  nudge: string; // user-facing copy
}

// ---- Call ④ — Persona suggest ----
export interface PersonaSuggestRequest {
  mood: Mood | null;
  workout: WorkoutLog | null;
  history: RecipeCard[];
}
export interface PersonaSuggestResult {
  persona: ChefPersona;
  reason: string;
}

// ---- Call ⑤ — Recipe generate (SSE) ----
export interface RecipeGenerateRequest {
  context: RecipeContext;
}

// SSE event shape from call ⑤ and ⑥.
// Frontend should render `dishName` and `intro` as they stream (SPEC §4).
export type RecipeStreamEvent =
  | { type: 'meta'; recipeId: string; persona: ChefPersona }
  | { type: 'dishName'; delta: string }
  | { type: 'intro'; delta: string }
  | { type: 'ingredient'; ingredient: RecipeIngredient }
  | { type: 'step'; index: number; text: string }
  | { type: 'macros'; macros: RecipeMacros }
  | { type: 'workoutNote'; text: string }
  | { type: 'done'; recipe: RecipeCard }
  | { type: 'error'; error: string };

// ---- Call ⑥ — Tone switch (SSE) ----
export type ToneSwitchKind = 'swap-persona' | 'fancier' | 'simpler' | 'shorter';
export interface RecipeRetoneRequest {
  recipe: RecipeCard;
  kind: ToneSwitchKind;
  newPersona?: ChefPersona; // required when kind === 'swap-persona'
}

// ---- Call ⑦ — Seasonal brief ----
export interface SeasonalBriefRequest {
  region?: string; // e.g. "UK", "Berlin"
  month?: number; // 1-12; defaults to current month server-side
}
export interface SeasonalBriefResult {
  brief: string;
  fetchedAt: number;
}

// ---- Call ⑧ — One-liner ----
export interface OneLinerRequest {
  recipe: RecipeCard;
}
export interface OneLinerResult {
  oneLiner: string;
}
