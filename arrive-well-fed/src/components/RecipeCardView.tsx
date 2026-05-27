import { useSession } from '@/state/store';
import { ToneSwitcher } from '@/components/ToneSwitcher';
import type { ChefPersona } from '@shared/types';

const PERSONA_EMOJI: Record<ChefPersona, string> = {
  michelin: '👨‍🍳',
  grandma: '👵',
  gremlin: '🤪',
  host: '📺',
  nutritionist: '💊',
};

// The screenshot deliverable. Fixed-aspect frame, hero typography.
export function RecipeCardView() {
  const recipe = useSession((s) => s.currentRecipe);
  const reset = useSession((s) => s.reset);

  if (!recipe) {
    return (
      <div className="panel text-center text-ink/60">
        No recipe yet — head back to start.
        <div className="mt-3">
          <button className="btn-primary" onClick={reset}>
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {recipe.shareableOneLiner && (
        <p className="text-center font-display text-lg italic text-ketchup">
          "{recipe.shareableOneLiner}"
        </p>
      )}

      <article className="relative mx-auto max-w-xl rounded-3xl bg-cream p-8 shadow-card ring-1 ring-ink/10">
        <div className="absolute right-6 top-6 text-3xl" title={recipe.persona}>
          {PERSONA_EMOJI[recipe.persona]}
        </div>

        <header className="space-y-2">
          <div className="text-xs uppercase tracking-widest text-ink/40">
            Arrive Well-Fed
          </div>
          <h2 className="font-display text-3xl text-ketchup">{recipe.dishName}</h2>
          <p className="text-ink/80">{recipe.intro}</p>
        </header>

        <section className="mt-6">
          <h3 className="mb-2 font-display text-sm uppercase tracking-widest text-ink/50">
            Ingredients
          </h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between border-b border-ink/10 py-1">
                <span>
                  {ing.inPantry ? '✅' : '🛒'} {ing.name}
                </span>
                <span className="text-ink/60">{ing.amount}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h3 className="mb-2 font-display text-sm uppercase tracking-widest text-ink/50">
            Method
          </h3>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
            {recipe.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>

        <section className="mt-6">
          <MacroBar recipe={recipe} />
        </section>

        {recipe.workoutNote && (
          <p className="mt-4 rounded-xl bg-butter/40 px-4 py-2 text-sm italic">
            🏋️ {recipe.workoutNote}
          </p>
        )}
      </article>

      <ToneSwitcher />

      <div className="text-center">
        <button className="btn-ghost" onClick={reset}>
          Cook something else
        </button>
      </div>
    </section>
  );
}

function MacroBar({ recipe }: { recipe: import('@shared/types').RecipeCard }) {
  const { proteinG, carbsG, fatG, kcal } = recipe.macros;
  const total = Math.max(1, proteinG + carbsG + fatG);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs uppercase tracking-widest text-ink/50">
        <span>Macros</span>
        <span>{kcal} kcal</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full ring-1 ring-ink/10">
        <div className="bg-tomato" style={{ width: `${(proteinG / total) * 100}%` }} />
        <div className="bg-mustard" style={{ width: `${(carbsG / total) * 100}%` }} />
        <div className="bg-olive" style={{ width: `${(fatG / total) * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-ink/60">
        <span>P {proteinG}g</span>
        <span>C {carbsG}g</span>
        <span>F {fatG}g</span>
      </div>
    </div>
  );
}
