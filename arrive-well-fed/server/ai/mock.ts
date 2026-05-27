import { randomUUID } from 'node:crypto';
import type {
  ChefPersona,
  FridgeScanResult,
  Mood,
  NutritionBrief,
  OneLinerResult,
  PantryGapResult,
  PersonaSuggestResult,
  RecipeCard,
  RecipeContext,
  RecipeStreamEvent,
  SeasonalBriefResult,
  ToneSwitchKind,
  WorkoutLog,
} from '../../shared/types.js';

// Per SPEC §4: mockClaudeClient returns canned RecipeCards keyed off mood + persona.
// Eng 2 develops the UI against this. Eng 1 swaps in the real client once endpoints are live.

const personaOpeners: Record<ChefPersona, (dish: string, mood: Mood | null) => string> = {
  michelin: (dish, mood) =>
    `Tonight, ${dish}. A study in restraint, calibrated for someone ${mood ?? 'attentive'}. Mise en place: non-negotiable.`,
  grandma: (dish) =>
    `Sit down, eat. ${dish} — like I made for your father when he was your age. Use a handful, not a measure. Listen to the pan.`,
  gremlin: (dish) =>
    `${dish}. Don't ask. Trust the pan. Trust the salt. Trust me. Don't.`,
  host: (dish) =>
    `Beautiful. Just beautiful. We're making ${dish}, and it is going to be — and I mean this — beautiful.`,
  nutritionist: (dish, mood) =>
    `${dish}: 38g protein, balanced micros, anti-inflammatory profile. Optimal for a ${mood ?? 'recovering'} body.`,
};

function pickDish(persona: ChefPersona, ingredients: string[]): string {
  const lead = ingredients[0] ?? 'pantry';
  switch (persona) {
    case 'michelin':
      return `${capitalise(lead)} confit, brown butter, citrus`;
    case 'grandma':
      return `One-pan ${lead} the way it should be`;
    case 'gremlin':
      return `${capitalise(lead)} chaos bowl (it works)`;
    case 'host':
      return `Beautiful golden ${lead} traybake`;
    case 'nutritionist':
      return `High-protein ${lead} recovery bowl`;
  }
}

function capitalise(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function buildMockRecipe(context: RecipeContext): RecipeCard {
  const persona = context.persona;
  const pantryNames = context.pantry.items.map((i) => i.name.toLowerCase());
  const sample = pantryNames.length ? pantryNames : ['chicken', 'rice', 'lemon'];
  const dishName = pickDish(persona, sample);

  const intro = personaOpeners[persona](dishName, context.mood);

  const macros = macrosFor(context.nutritionBrief);

  return {
    id: randomUUID(),
    dishName,
    intro,
    ingredients: [
      ...sample.slice(0, 4).map((name) => ({
        name: capitalise(name),
        amount: persona === 'grandma' ? 'a handful' : '150g',
        inPantry: true,
      })),
      { name: 'Lemon', amount: '1', inPantry: pantryNames.includes('lemon') },
      { name: 'Olive oil', amount: '2 tbsp', inPantry: true },
      { name: 'Flaky salt', amount: 'to taste', inPantry: false },
    ],
    steps: stepsFor(persona, dishName),
    macros,
    workoutNote: workoutNote(context),
    persona,
    createdAt: Date.now(),
  };
}

function macrosFor(brief: NutritionBrief) {
  switch (brief.macroPriority) {
    case 'protein-heavy':
      return { proteinG: 48, carbsG: 55, fatG: 18, kcal: 620 };
    case 'carb-forward':
      return { proteinG: 28, carbsG: 95, fatG: 16, kcal: 680 };
    case 'light':
      return { proteinG: 22, carbsG: 35, fatG: 12, kcal: 380 };
    case 'balanced':
    default:
      return { proteinG: 32, carbsG: 60, fatG: 20, kcal: 560 };
  }
}

function stepsFor(persona: ChefPersona, dish: string): string[] {
  switch (persona) {
    case 'michelin':
      return [
        'Bring a cast-iron pan to smoking. Patience.',
        'Sear the protein hard on one side. Do not move it.',
        'Deglaze with citrus. Mount with cold butter off the heat.',
        'Rest. Plate. Salt. Serve immediately.',
      ];
    case 'grandma':
      return [
        'Put a big pan on the stove, a glug of oil.',
        'Cook the onions slow. No rush. Talk to me.',
        'Add everything else. Cover. Let it think.',
        'When it smells right, it is right. Eat it now while hot.',
      ];
    case 'gremlin':
      return [
        'Heat the pan. Hot. Hotter.',
        'Throw everything in. All of it. Now.',
        'Salt twice. Pretend you forgot.',
        'Eat standing up. It tastes better.',
      ];
    case 'host':
      return [
        'Preheat — and I do mean preheat — the oven to 200°C.',
        'Toss the ingredients in oil. Beautiful colour. Look at that.',
        'Roast 22 minutes. The smell. The smell.',
        'Plate it up. Hit it with the lemon. Beautiful.',
      ];
    case 'nutritionist':
      return [
        'Weigh protein source. Aim for 40g protein per serving.',
        'Cook to internal temp 74°C. Rest 3 minutes.',
        'Steam vegetables — preserve micronutrients, avoid oil overload.',
        'Plate with whole-grain base. Hydrate alongside.',
      ];
  }
}

function workoutNote(context: RecipeContext): string | undefined {
  if (context.nutritionBrief.recoveryWindowMin > 0) {
    return `Eat within ${context.nutritionBrief.recoveryWindowMin} min — ${context.nutritionBrief.notes}`;
  }
  return undefined;
}

// ---- Streaming helper ----
// Mimics the SSE shape that the real client will produce.
export async function* streamMockRecipe(
  context: RecipeContext,
): AsyncGenerator<RecipeStreamEvent> {
  const recipe = buildMockRecipe(context);

  yield { type: 'meta', recipeId: recipe.id, persona: recipe.persona };

  for (const chunk of chunkText(recipe.dishName, 4)) {
    await sleep(40);
    yield { type: 'dishName', delta: chunk };
  }

  for (const chunk of chunkText(recipe.intro, 8)) {
    await sleep(35);
    yield { type: 'intro', delta: chunk };
  }

  for (const ing of recipe.ingredients) {
    await sleep(60);
    yield { type: 'ingredient', ingredient: ing };
  }

  for (let i = 0; i < recipe.steps.length; i++) {
    await sleep(120);
    yield { type: 'step', index: i, text: recipe.steps[i] };
  }

  await sleep(80);
  yield { type: 'macros', macros: recipe.macros };

  if (recipe.workoutNote) {
    await sleep(60);
    yield { type: 'workoutNote', text: recipe.workoutNote };
  }

  yield { type: 'done', recipe };
}

function chunkText(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- Tone switch ----
export async function* streamMockRetone(
  recipe: RecipeCard,
  kind: ToneSwitchKind,
  newPersona?: ChefPersona,
): AsyncGenerator<RecipeStreamEvent> {
  const persona = kind === 'swap-persona' && newPersona ? newPersona : recipe.persona;
  const dish =
    kind === 'fancier'
      ? `${recipe.dishName}, refined`
      : kind === 'simpler'
      ? recipe.dishName.split(',')[0]
      : recipe.dishName;
  const intro = personaOpeners[persona](dish, null);

  const next: RecipeCard = {
    ...recipe,
    id: randomUUID(),
    persona,
    dishName: dish,
    intro,
    steps:
      kind === 'shorter'
        ? recipe.steps.slice(0, Math.max(2, recipe.steps.length - 1))
        : recipe.steps,
    createdAt: Date.now(),
  };

  yield { type: 'meta', recipeId: next.id, persona: next.persona };
  for (const c of chunkText(next.dishName, 4)) {
    await sleep(30);
    yield { type: 'dishName', delta: c };
  }
  for (const c of chunkText(next.intro, 8)) {
    await sleep(25);
    yield { type: 'intro', delta: c };
  }
  for (let i = 0; i < next.steps.length; i++) {
    await sleep(80);
    yield { type: 'step', index: i, text: next.steps[i] };
  }
  yield { type: 'done', recipe: next };
}

// ---- Non-streaming helpers ----

export function mockNutritionBrief(workout: WorkoutLog | null): NutritionBrief {
  if (!workout || workout.preset === 'rest') {
    return {
      estimatedKcalBurn: 0,
      macroPriority: 'balanced',
      recoveryWindowMin: 0,
      notes: 'No workout logged — go with whatever the mood asks for.',
    };
  }
  if (workout.preset === 'weights') {
    return {
      estimatedKcalBurn: 380,
      macroPriority: 'protein-heavy',
      recoveryWindowMin: 60,
      notes: 'Heavy session. Prioritise 40g+ protein and moderate carbs within an hour.',
    };
  }
  if (workout.preset === 'cardio' || workout.sport === 'running') {
    return {
      estimatedKcalBurn: 520,
      macroPriority: 'carb-forward',
      recoveryWindowMin: 45,
      notes: 'Glycogen depletion likely. Fast-digesting carbs + protein within 45 min.',
    };
  }
  return {
    estimatedKcalBurn: 180,
    macroPriority: 'light',
    recoveryWindowMin: 30,
    notes: 'Light session. Lean toward anti-inflammatory ingredients.',
  };
}

export function mockFridgeScan(): FridgeScanResult {
  return {
    items: [
      { name: 'Chicken breast', category: 'proteins', confidence: 0.92 },
      { name: 'Eggs', category: 'proteins', confidence: 0.88 },
      { name: 'Spinach', category: 'veg', confidence: 0.81 },
      { name: 'Greek yoghurt', category: 'dairy', confidence: 0.78 },
      { name: 'Garlic', category: 'veg', confidence: 0.95 },
    ],
    weirdDrawer: ['half a jar of gochujang'],
  };
}

export function mockPantryGap(): PantryGapResult {
  return {
    ingredient: 'Greek yoghurt',
    unlocks: 12,
    nudge: 'Pick up Greek yoghurt and you’d unlock 12 more dishes from your current pantry.',
  };
}

export function mockPersonaSuggest(): PersonaSuggestResult {
  return {
    persona: 'grandma',
    reason: 'You seem tired. Grandma feels right tonight.',
  };
}

export function mockSeasonalBrief(): SeasonalBriefResult {
  return {
    brief: 'In season right now: asparagus, broad beans, new potatoes, strawberries.',
    fetchedAt: Date.now(),
  };
}

export function mockOneLiner(recipe: RecipeCard): OneLinerResult {
  const map: Record<ChefPersona, string> = {
    gremlin: `You had what you had, and somehow ${recipe.dishName.toLowerCase()} happened.`,
    michelin: `Tonight: ${recipe.dishName}. No notes.`,
    grandma: `Sit. Eat. ${recipe.dishName}. That's it.`,
    host: `Look at that — ${recipe.dishName}. Beautiful.`,
    nutritionist: `${recipe.dishName}: hits the macros, hits the spot.`,
  };
  return { oneLiner: map[recipe.persona] };
}
