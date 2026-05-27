import { useSession } from '@/state/store';

// Streaming view — renders the recipe card progressively as SSE arrives.
// Per SPEC §4: dishName and intro should appear character-by-character;
// steps appear as full items.
export function CookingScreen() {
  const streaming = useSession((s) => s.streamingRecipe);

  if (!streaming) {
    return (
      <div className="panel text-center text-ink/60">
        Warming the pan…
      </div>
    );
  }

  return (
    <article className="panel space-y-4">
      <header>
        <div className="text-xs uppercase tracking-widest text-ink/40">Cooking…</div>
        <h2 className="text-3xl text-ketchup">
          {streaming.dishName || ' '}
          <Cursor />
        </h2>
      </header>

      <p className="text-ink/80">
        {streaming.intro || ' '}
        {!streaming.steps?.length && <Cursor />}
      </p>

      {!!streaming.ingredients?.length && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {streaming.ingredients.map((ing, i) => (
            <li key={i} className="flex justify-between border-b border-ink/5 py-1">
              <span>
                {ing.inPantry ? '✅' : '🛒'} {ing.name}
              </span>
              <span className="text-ink/60">{ing.amount}</span>
            </li>
          ))}
        </ul>
      )}

      {!!streaming.steps?.length && (
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          {streaming.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
    </article>
  );
}

function Cursor() {
  return <span className="ml-0.5 inline-block w-1.5 animate-pulse bg-tomato align-baseline" style={{ height: '1em' }} />;
}
