import { useState } from 'react';
import { useSession } from '@/state/store';
import { api, streamRecipe } from '@/lib/api';
import type { Intent, Mood, RecipeContext } from '@shared/types';

const MOODS: { id: Mood; emoji: string; label: string }[] = [
  { id: 'energised', emoji: '⚡', label: 'Energised' },
  { id: 'tired', emoji: '😮‍💨', label: 'Tired' },
  { id: 'stressed', emoji: '🌪️', label: 'Stressed' },
  { id: 'comfortable', emoji: '🛋️', label: 'Comfortable' },
  { id: 'adventurous', emoji: '🧭', label: 'Adventurous' },
];

const INTENTS: { id: Intent; emoji: string; label: string }[] = [
  { id: 'fuel', emoji: '🏋️', label: 'Fuel a workout' },
  { id: 'recover', emoji: '🥤', label: 'Recover' },
  { id: 'comfort', emoji: '🤗', label: 'Comfort eat' },
  { id: 'quick', emoji: '⏱️', label: 'Quick & easy' },
  { id: 'adventurous', emoji: '🎲', label: 'Try something new' },
];

export function MoodPicker() {
  const mood = useSession((s) => s.mood);
  const intent = useSession((s) => s.intent);
  const persona = useSession((s) => s.selectedPersona);
  const pantry = useSession((s) => s.pantry);
  const workout = useSession((s) => s.workout);
  const history = useSession((s) => s.history);
  const surpriseMe = useSession((s) => s.surpriseMe);
  const setMood = useSession((s) => s.setMood);
  const setIntent = useSession((s) => s.setIntent);
  const setSurpriseMe = useSession((s) => s.setSurpriseMe);
  const startStreaming = useSession((s) => s.startStreaming);
  const applyStreamPatch = useSession((s) => s.applyStreamPatch);
  const finishStreaming = useSession((s) => s.finishStreaming);
  const back = useSession((s) => s.back);

  const [error, setError] = useState<string | null>(null);

  const cook = async () => {
    if (!mood || !intent || !persona) return;
    setError(null);
    try {
      const nutritionBrief = await api.workoutBrief(workout);
      const context: RecipeContext = {
        pantry,
        persona,
        mood,
        intent,
        nutritionBrief,
        surpriseMe: { enabled: surpriseMe, history },
      };
      startStreaming();
      let last: Partial<import('@shared/types').RecipeCard> = {};
      for await (const ev of streamRecipe(context)) {
        switch (ev.type) {
          case 'meta':
            last = { ...last, id: ev.recipeId, persona: ev.persona, createdAt: Date.now() };
            applyStreamPatch(last);
            break;
          case 'dishName':
            last = { ...last, dishName: (last.dishName ?? '') + ev.delta };
            applyStreamPatch({ dishName: last.dishName });
            break;
          case 'intro':
            last = { ...last, intro: (last.intro ?? '') + ev.delta };
            applyStreamPatch({ intro: last.intro });
            break;
          case 'ingredient':
            last = { ...last, ingredients: [...(last.ingredients ?? []), ev.ingredient] };
            applyStreamPatch({ ingredients: last.ingredients });
            break;
          case 'step':
            last = { ...last, steps: [...(last.steps ?? []), ev.text] };
            applyStreamPatch({ steps: last.steps });
            break;
          case 'macros':
            last = { ...last, macros: ev.macros };
            applyStreamPatch({ macros: ev.macros });
            break;
          case 'workoutNote':
            last = { ...last, workoutNote: ev.text };
            applyStreamPatch({ workoutNote: ev.text });
            break;
          case 'done':
            finishStreaming(ev.recipe);
            // Fire-and-forget one-liner per SPEC §10.5
            api
              .oneLiner(ev.recipe)
              .then((r) => {
                const updated = { ...ev.recipe, shareableOneLiner: r.oneLiner };
                useSessionGetState().applyStreamPatch(updated);
                useSessionGetState().finishStreaming(updated);
              })
              .catch(() => {});
            return;
          case 'error':
            setError(ev.error);
            return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cooking failed');
    }
  };

  return (
    <section className="space-y-6">
      <div className="panel">
        <h2 className="text-2xl">④ Set your mood</h2>
        <p className="text-sm text-ink/60">Two taps shape everything.</p>
      </div>

      <div className="panel space-y-3">
        <h3 className="text-lg">How are you feeling?</h3>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              className={`chip ${mood === m.id ? 'chip--active' : ''}`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel space-y-3">
        <h3 className="text-lg">What do you want?</h3>
        <div className="flex flex-wrap gap-2">
          {INTENTS.map((i) => (
            <button
              key={i.id}
              onClick={() => setIntent(i.id)}
              className={`chip ${intent === i.id ? 'chip--active' : ''}`}
            >
              {i.emoji} {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel flex items-center justify-between">
        <div>
          <h3 className="text-lg">🎲 Surprise me</h3>
          <p className="text-xs text-ink/60">
            Deliberately step outside your comfort zone.
          </p>
        </div>
        <button
          onClick={() => setSurpriseMe(!surpriseMe)}
          className={`chip ${surpriseMe ? 'chip--active' : ''}`}
        >
          {surpriseMe ? 'On' : 'Off'}
        </button>
      </div>

      {error && (
        <div className="panel border-tomato text-tomato">⚠️ {error}</div>
      )}

      <div className="flex justify-between">
        <button className="btn-ghost" onClick={back}>
          ← Back
        </button>
        <button
          className="btn-primary text-lg"
          disabled={!mood || !intent || !persona}
          onClick={cook}
        >
          Cook Something →
        </button>
      </div>
    </section>
  );
}

// Tiny helper to avoid stale closures when the one-liner promise resolves.
function useSessionGetState() {
  return useSession.getState();
}
