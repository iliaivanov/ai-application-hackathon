import { useSession } from '@/state/store';
import type { ChefPersona } from '@shared/types';

const PERSONA_EMOJI: Record<ChefPersona, string> = {
  michelin: '👨‍🍳',
  grandma: '👵',
  gremlin: '🤪',
  host: '📺',
  nutritionist: '💊',
};

export function HistoryStrip() {
  const history = useSession((s) => s.history);
  const select = useSession((s) => s.selectFromHistory);
  const current = useSession((s) => s.currentRecipe);

  if (!history.length) return null;

  return (
    <div className="-mx-2 flex gap-2 overflow-x-auto px-2 py-1">
      {history.map((r) => {
        const active = current?.id === r.id;
        return (
          <button
            key={r.id}
            onClick={() => select(r.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              active
                ? 'border-tomato bg-tomato text-cream'
                : 'border-ink/15 bg-white/70 hover:bg-white'
            }`}
            title={r.dishName}
          >
            <span>{PERSONA_EMOJI[r.persona]}</span>
            <span className="max-w-[180px] truncate">{r.dishName}</span>
          </button>
        );
      })}
    </div>
  );
}
