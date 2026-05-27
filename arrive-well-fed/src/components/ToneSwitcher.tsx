import { useState } from 'react';
import { useSession } from '@/state/store';
import { streamRetone } from '@/lib/api';
import type { ChefPersona, RecipeCard, ToneSwitchKind } from '@shared/types';

const PERSONAS: { id: ChefPersona; emoji: string }[] = [
  { id: 'michelin', emoji: '👨‍🍳' },
  { id: 'grandma', emoji: '👵' },
  { id: 'gremlin', emoji: '🤪' },
  { id: 'host', emoji: '📺' },
  { id: 'nutritionist', emoji: '💊' },
];

export function ToneSwitcher() {
  const recipe = useSession((s) => s.currentRecipe);
  const startStreaming = useSession((s) => s.startStreaming);
  const applyStreamPatch = useSession((s) => s.applyStreamPatch);
  const finishStreaming = useSession((s) => s.finishStreaming);
  const setPersona = useSession((s) => s.setPersona);

  const [swapOpen, setSwapOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!recipe) return null;

  const retone = async (kind: ToneSwitchKind, newPersona?: ChefPersona) => {
    setBusy(true);
    setSwapOpen(false);
    if (newPersona) setPersona(newPersona);
    try {
      startStreaming();
      let last: Partial<RecipeCard> = {};
      for await (const ev of streamRetone({ recipe, kind, newPersona })) {
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
          case 'step':
            last = { ...last, steps: [...(last.steps ?? []), ev.text] };
            applyStreamPatch({ steps: last.steps });
            break;
          case 'done':
            finishStreaming({
              ...recipe,
              ...ev.recipe,
              ingredients: ev.recipe.ingredients?.length
                ? ev.recipe.ingredients
                : recipe.ingredients,
              macros: ev.recipe.macros ?? recipe.macros,
            });
            return;
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <div className="relative">
        <button
          className="btn-ghost"
          disabled={busy}
          onClick={() => setSwapOpen((x) => !x)}
        >
          🎭 Swap chef
        </button>
        {swapOpen && (
          <div className="absolute left-1/2 z-10 mt-2 flex -translate-x-1/2 gap-1 rounded-full bg-white p-1 shadow-lg ring-1 ring-ink/10">
            {PERSONAS.filter((p) => p.id !== recipe.persona).map((p) => (
              <button
                key={p.id}
                className="rounded-full p-2 text-xl hover:bg-butter/30"
                onClick={() => retone('swap-persona', p.id)}
                title={p.id}
              >
                {p.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="btn-ghost" disabled={busy} onClick={() => retone('fancier')}>
        ✨ Fancier
      </button>
      <button className="btn-ghost" disabled={busy} onClick={() => retone('simpler')}>
        🪶 Simpler
      </button>
      <button className="btn-ghost" disabled={busy} onClick={() => retone('shorter')}>
        ⚡ Shorter
      </button>
    </div>
  );
}
