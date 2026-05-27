import { create } from 'zustand';
import type {
  ChefPersona,
  Intent,
  Mood,
  Pantry,
  PantryCategory,
  PantryItem,
  RecipeCard,
  WorkoutLog,
} from '@shared/types';
import { storage } from '@/lib/storage';

// 6-step flow per SPEC §5: pantry → persona → workout → mood → cooking → result
export type Step =
  | 'pantry'
  | 'persona'
  | 'workout'
  | 'mood'
  | 'cooking'
  | 'result';

interface SessionStore {
  step: Step;
  pantry: Pantry;
  history: RecipeCard[];
  currentRecipe: RecipeCard | null;
  streamingRecipe: Partial<RecipeCard> | null; // partial state during SSE stream
  selectedPersona: ChefPersona | null;
  mood: Mood | null;
  intent: Intent | null;
  workout: WorkoutLog | null;
  surpriseMe: boolean;

  // Step navigation
  goTo: (step: Step) => void;
  next: () => void;
  back: () => void;

  // Pantry
  addPantryItem: (item: Omit<PantryItem, 'usageCount' | 'addedAt'>) => void;
  togglePantryItem: (id: string) => void;
  removePantryItem: (id: string) => void;
  addWeirdItem: (text: string) => void;
  removeWeirdItem: (text: string) => void;
  bulkAddItems: (items: { name: string; category: PantryCategory }[]) => void;

  // Selections
  setPersona: (p: ChefPersona) => void;
  setMood: (m: Mood) => void;
  setIntent: (i: Intent) => void;
  setWorkout: (w: WorkoutLog | null) => void;
  setSurpriseMe: (b: boolean) => void;

  // Recipe lifecycle
  startStreaming: () => void;
  applyStreamPatch: (patch: Partial<RecipeCard>) => void;
  finishStreaming: (recipe: RecipeCard) => void;
  selectFromHistory: (id: string) => void;

  reset: () => void;
}

const emptyPantry: Pantry = { items: [], weirdDrawer: [] };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const STEP_ORDER: Step[] = ['pantry', 'persona', 'workout', 'mood', 'cooking', 'result'];

export const useSession = create<SessionStore>((set, get) => ({
  step: 'pantry',
  pantry: storage.loadPantry() ?? emptyPantry,
  history: storage.loadHistory(),
  currentRecipe: null,
  streamingRecipe: null,
  selectedPersona: storage.loadLastPersona(),
  mood: null,
  intent: null,
  workout: null,
  surpriseMe: false,

  goTo: (step) => set({ step }),
  next: () => {
    const i = STEP_ORDER.indexOf(get().step);
    if (i >= 0 && i < STEP_ORDER.length - 1) set({ step: STEP_ORDER[i + 1] });
  },
  back: () => {
    const i = STEP_ORDER.indexOf(get().step);
    if (i > 0) set({ step: STEP_ORDER[i - 1] });
  },

  addPantryItem: (item) => {
    const pantry = get().pantry;
    if (pantry.items.some((x) => x.id === item.id)) return;
    const next: Pantry = {
      ...pantry,
      items: [
        ...pantry.items,
        { ...item, usageCount: 0, addedAt: Date.now() },
      ],
    };
    storage.savePantry(next);
    set({ pantry: next });
  },

  togglePantryItem: (id) => {
    const pantry = get().pantry;
    const exists = pantry.items.some((x) => x.id === id);
    if (!exists) return;
    const next: Pantry = {
      ...pantry,
      items: pantry.items.filter((x) => x.id !== id),
    };
    storage.savePantry(next);
    set({ pantry: next });
  },

  removePantryItem: (id) => {
    const pantry = get().pantry;
    const next: Pantry = {
      ...pantry,
      items: pantry.items.filter((x) => x.id !== id),
    };
    storage.savePantry(next);
    set({ pantry: next });
  },

  addWeirdItem: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const pantry = get().pantry;
    if (pantry.weirdDrawer.includes(trimmed)) return;
    const next: Pantry = {
      ...pantry,
      weirdDrawer: [...pantry.weirdDrawer, trimmed],
    };
    storage.savePantry(next);
    set({ pantry: next });
  },

  removeWeirdItem: (text) => {
    const pantry = get().pantry;
    const next: Pantry = {
      ...pantry,
      weirdDrawer: pantry.weirdDrawer.filter((x) => x !== text),
    };
    storage.savePantry(next);
    set({ pantry: next });
  },

  bulkAddItems: (items) => {
    const pantry = get().pantry;
    const existingIds = new Set(pantry.items.map((x) => x.id));
    const additions: PantryItem[] = items
      .map((i) => ({
        id: slugify(i.name),
        name: i.name,
        category: i.category,
        usageCount: 0,
        addedAt: Date.now(),
      }))
      .filter((i) => !existingIds.has(i.id));
    const next: Pantry = {
      ...pantry,
      items: [...pantry.items, ...additions],
    };
    storage.savePantry(next);
    set({ pantry: next });
  },

  setPersona: (p) => {
    storage.saveLastPersona(p);
    set({ selectedPersona: p });
  },
  setMood: (m) => set({ mood: m }),
  setIntent: (i) => set({ intent: i }),
  setWorkout: (w) => set({ workout: w }),
  setSurpriseMe: (b) => set({ surpriseMe: b }),

  startStreaming: () =>
    set({
      step: 'cooking',
      streamingRecipe: {
        dishName: '',
        intro: '',
        ingredients: [],
        steps: [],
      },
    }),

  applyStreamPatch: (patch) =>
    set((s) => ({
      streamingRecipe: { ...(s.streamingRecipe ?? {}), ...patch },
    })),

  finishStreaming: (recipe) => {
    const history = [...get().history, recipe].slice(-20);
    storage.saveHistory(history);
    set({
      step: 'result',
      currentRecipe: recipe,
      streamingRecipe: null,
      history,
    });
  },

  selectFromHistory: (id) => {
    const recipe = get().history.find((r) => r.id === id);
    if (recipe) set({ currentRecipe: recipe, step: 'result' });
  },

  reset: () =>
    set({
      step: 'pantry',
      currentRecipe: null,
      streamingRecipe: null,
      mood: null,
      intent: null,
      workout: null,
      surpriseMe: false,
    }),
}));
