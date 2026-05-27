import { useSession } from '@/state/store';
import type { ChefPersona } from '@shared/types';

const PERSONAS: { id: ChefPersona; emoji: string; name: string; tagline: string }[] = [
  { id: 'michelin', emoji: '👨‍🍳', name: 'Michelin Chef', tagline: 'Precise, technical, silently judging.' },
  { id: 'grandma', emoji: '👵', name: 'Grandma', tagline: 'Measures in a handful. Free life advice.' },
  { id: 'gremlin', emoji: '🤪', name: 'Chaotic Gremlin', tagline: 'Unhinged combos. Somehow works.' },
  { id: 'host', emoji: '📺', name: 'Cooking Show Host', tagline: 'Says "beautiful" every other sentence.' },
  { id: 'nutritionist', emoji: '💊', name: 'Nutritionist', tagline: 'Very serious about protein.' },
];

export function PersonaSelector() {
  const selected = useSession((s) => s.selectedPersona);
  const setPersona = useSession((s) => s.setPersona);
  const next = useSession((s) => s.next);
  const back = useSession((s) => s.back);

  return (
    <section className="space-y-6">
      <div className="panel">
        <h2 className="text-2xl">② Pick a chef</h2>
        <p className="text-sm text-ink/60">Who's cooking for you tonight?</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PERSONAS.map((p) => {
          const on = selected === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={`panel text-left transition ${
                on ? 'ring-2 ring-tomato' : 'hover:-translate-y-0.5 hover:shadow-md'
              }`}
            >
              <div className="text-4xl">{p.emoji}</div>
              <div className="mt-2 font-display text-xl">{p.name}</div>
              <div className="mt-1 text-sm text-ink/60">{p.tagline}</div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button className="btn-ghost" onClick={back}>
          ← Back
        </button>
        <button className="btn-primary" disabled={!selected} onClick={next}>
          Log workout →
        </button>
      </div>
    </section>
  );
}
