import type {
  ApiResponse,
  FridgeScanRequest,
  FridgeScanResult,
  NutritionBrief,
  OneLinerResult,
  PantryGapResult,
  PersonaSuggestResult,
  RecipeCard,
  RecipeContext,
  RecipeRetoneRequest,
  RecipeStreamEvent,
  SeasonalBriefResult,
  WorkoutLog,
} from '@shared/types';

async function postJson<TReq, TRes>(
  url: string,
  body: TReq,
): Promise<TRes> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const json = (await res.json()) as ApiResponse<TRes>;
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

// ---- Non-streaming endpoints ----
export const api = {
  scanFridge: (req: FridgeScanRequest) =>
    postJson<FridgeScanRequest, FridgeScanResult>('/api/vision/fridge', req),

  workoutBrief: (workout: WorkoutLog | null) =>
    postJson<{ workout: WorkoutLog | null }, NutritionBrief>('/api/workout/brief', {
      workout,
    }),

  pantryGap: (pantry: unknown, history: unknown) =>
    postJson<unknown, PantryGapResult>('/api/pantry/gap', { pantry, history }),

  personaSuggest: (payload: unknown) =>
    postJson<unknown, PersonaSuggestResult>('/api/persona/suggest', payload),

  seasonalBrief: (region?: string) =>
    postJson<{ region?: string }, SeasonalBriefResult>('/api/seasonal/brief', {
      region,
    }),

  oneLiner: (recipe: RecipeCard) =>
    postJson<{ recipe: RecipeCard }, OneLinerResult>('/api/recipe/oneliner', {
      recipe,
    }),
};

// ---- Streaming: recipe generate & retone ----
export async function* streamRecipe(
  context: RecipeContext,
  signal?: AbortSignal,
): AsyncGenerator<RecipeStreamEvent> {
  yield* postSse('/api/recipe/generate', { context }, signal);
}

export async function* streamRetone(
  body: RecipeRetoneRequest,
  signal?: AbortSignal,
): AsyncGenerator<RecipeStreamEvent> {
  yield* postSse('/api/recipe/retone', body, signal);
}

async function* postSse(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): AsyncGenerator<RecipeStreamEvent> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`${url} → HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const line = chunk.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const payload = line.slice('data: '.length).trim();
      if (!payload || payload === '{}') continue;
      try {
        yield JSON.parse(payload) as RecipeStreamEvent;
      } catch {
        // ignore malformed
      }
    }
  }
}
