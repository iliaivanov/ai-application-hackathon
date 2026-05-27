import { useSession, type Step } from '@/state/store';

const STEPS: { id: Step; label: string }[] = [
  { id: 'pantry', label: '① Pantry' },
  { id: 'persona', label: '② Chef' },
  { id: 'workout', label: '③ Workout' },
  { id: 'mood', label: '④ Mood' },
  { id: 'cooking', label: '⑤ Cook' },
  { id: 'result', label: '⑥ Eat' },
];

export function StepNav() {
  const step = useSession((s) => s.step);
  const goTo = useSession((s) => s.goTo);

  return (
    <nav className="flex flex-wrap gap-2">
      {STEPS.map((s) => (
        <button
          key={s.id}
          onClick={() => goTo(s.id)}
          className={`chip ${s.id === step ? 'chip--active' : ''}`}
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
