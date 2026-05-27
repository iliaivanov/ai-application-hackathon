import { useState } from 'react';
import { useSession } from '@/state/store';
import type { WorkoutIntensity, WorkoutPreset } from '@shared/types';

const PRESETS: { id: WorkoutPreset; emoji: string; label: string }[] = [
  { id: 'weights', emoji: '💪', label: 'Weights' },
  { id: 'cardio', emoji: '🏃', label: 'Cardio' },
  { id: 'recovery', emoji: '🧘', label: 'Recovery' },
  { id: 'rest', emoji: '😴', label: 'Rest day' },
];

const INTENSITIES: WorkoutIntensity[] = ['easy', 'moderate', 'hard', 'all-out'];

export function WorkoutLogger() {
  const workout = useSession((s) => s.workout);
  const setWorkout = useSession((s) => s.setWorkout);
  const next = useSession((s) => s.next);
  const back = useSession((s) => s.back);

  const [freeText, setFreeText] = useState(workout?.freeText ?? '');

  return (
    <section className="space-y-6">
      <div className="panel">
        <h2 className="text-2xl">③ Log a workout</h2>
        <p className="text-sm text-ink/60">
          Optional, but a heavy session means Grandma gets very serious about protein.
        </p>
      </div>

      <div className="panel space-y-3">
        <h3 className="text-lg">Quick tap</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const on = workout?.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setWorkout(on ? null : { preset: p.id })}
                className={`chip ${on ? 'chip--active' : ''}`}
              >
                {p.emoji} {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel space-y-3">
        <h3 className="text-lg">Or describe it</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onBlur={() =>
              setWorkout(freeText.trim() ? { ...(workout ?? {}), freeText } : workout)
            }
            placeholder="e.g. 45 min run, pretty hard"
            className="flex-1 rounded-full border border-ink/15 bg-white/80 px-4 py-2 text-sm outline-none focus:border-tomato"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {INTENSITIES.map((i) => {
            const on = workout?.intensity === i;
            return (
              <button
                key={i}
                onClick={() => setWorkout({ ...(workout ?? {}), intensity: on ? undefined : i })}
                className={`chip ${on ? 'chip--active' : ''}`}
              >
                {i}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button className="btn-ghost" onClick={back}>
          ← Back
        </button>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => { setWorkout(null); next(); }}>
            Skip
          </button>
          <button className="btn-primary" onClick={next}>
            How do you feel? →
          </button>
        </div>
      </div>
    </section>
  );
}
