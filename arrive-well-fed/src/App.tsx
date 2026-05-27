import { useEffect } from 'react';
import { useSession } from '@/state/store';
import { PantryBuilder } from '@/components/PantryBuilder';
import { PersonaSelector } from '@/components/PersonaSelector';
import { WorkoutLogger } from '@/components/WorkoutLogger';
import { MoodPicker } from '@/components/MoodPicker';
import { CookingScreen } from '@/components/CookingScreen';
import { RecipeCardView } from '@/components/RecipeCardView';
import { HistoryStrip } from '@/components/HistoryStrip';
import { StepNav } from '@/components/StepNav';

export default function App() {
  const step = useSession((s) => s.step);

  useEffect(() => {
    document.title = 'Arrive Well-Fed';
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      <Header />
      <HistoryStrip />
      <StepNav />
      <main className="flex-1">
        {step === 'pantry' && <PantryBuilder />}
        {step === 'persona' && <PersonaSelector />}
        {step === 'workout' && <WorkoutLogger />}
        {step === 'mood' && <MoodPicker />}
        {step === 'cooking' && <CookingScreen />}
        {step === 'result' && <RecipeCardView />}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-end justify-between">
      <div>
        <h1 className="text-4xl text-ketchup">Arrive Well-Fed.</h1>
        <p className="text-sm text-ink/60">
          You just parked. Now what do you eat?
        </p>
      </div>
      <span className="text-xs uppercase tracking-widest text-ink/40">
        Hackathon · May 2026
      </span>
    </header>
  );
}
