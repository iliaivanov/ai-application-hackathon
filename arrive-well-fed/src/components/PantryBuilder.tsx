import { useState } from 'react';
import { useSession } from '@/state/store';
import type { PantryCategory } from '@shared/types';
import { api } from '@/lib/api';

const CATEGORIES: { id: PantryCategory; label: string; suggestions: string[] }[] = [
  {
    id: 'proteins',
    label: '🥩 Proteins',
    suggestions: ['Chicken breast', 'Eggs', 'Tofu', 'Salmon', 'Lentils', 'Beef mince'],
  },
  {
    id: 'veg',
    label: '🥦 Veg',
    suggestions: ['Spinach', 'Onion', 'Tomato', 'Garlic', 'Mushrooms', 'Courgette'],
  },
  {
    id: 'grains',
    label: '🌾 Grains',
    suggestions: ['Rice', 'Pasta', 'Quinoa', 'Bread', 'Oats', 'Couscous'],
  },
  {
    id: 'dairy',
    label: '🧀 Dairy',
    suggestions: ['Greek yoghurt', 'Cheddar', 'Butter', 'Milk', 'Feta', 'Parmesan'],
  },
  {
    id: 'sauces',
    label: '🍯 Sauces',
    suggestions: ['Soy sauce', 'Olive oil', 'Tomato paste', 'Sriracha', 'Tahini', 'Vinegar'],
  },
  {
    id: 'spices',
    label: '🌶️ Spices',
    suggestions: ['Salt', 'Pepper', 'Paprika', 'Cumin', 'Chilli flakes', 'Oregano'],
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function PantryBuilder() {
  const pantry = useSession((s) => s.pantry);
  const addPantryItem = useSession((s) => s.addPantryItem);
  const removePantryItem = useSession((s) => s.removePantryItem);
  const addWeirdItem = useSession((s) => s.addWeirdItem);
  const removeWeirdItem = useSession((s) => s.removeWeirdItem);
  const bulkAddItems = useSession((s) => s.bulkAddItems);
  const next = useSession((s) => s.next);

  const [weirdInput, setWeirdInput] = useState('');
  const [scanning, setScanning] = useState(false);

  const ticked = (id: string) => pantry.items.some((x) => x.id === id);

  const toggle = (name: string, category: PantryCategory) => {
    const id = slugify(name);
    if (ticked(id)) removePantryItem(id);
    else addPantryItem({ id, name, category });
  };

  const handleFridgePhoto = async (file: File) => {
    setScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await api.scanFridge({ imageBase64: base64, mimeType: file.type });
      bulkAddItems(result.items.map((i) => ({ name: i.name, category: i.category })));
      for (const w of result.weirdDrawer) addWeirdItem(w);
    } catch (err) {
      console.error('Fridge scan failed', err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">① Build your pantry</h2>
          <label className="btn-ghost cursor-pointer">
            {scanning ? 'Scanning…' : '📸 Scan fridge'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={scanning}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFridgePhoto(f);
              }}
            />
          </label>
        </div>
        <p className="text-sm text-ink/60">
          Tick what's in your fridge. Anything weird goes in the drawer below.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="panel space-y-3">
            <h3 className="text-lg">{cat.label}</h3>
            <div className="flex flex-wrap gap-2">
              {cat.suggestions.map((name) => {
                const id = slugify(name);
                const on = ticked(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggle(name, cat.id)}
                    className={`chip ${on ? 'chip--active' : ''}`}
                  >
                    {on ? '✅' : '＋'} {name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="panel space-y-3">
        <h3 className="text-lg">🤔 Weird Drawer</h3>
        <p className="text-xs text-ink/60">
          Gochujang, anchovies, that random jar — type and press Enter.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={weirdInput}
            onChange={(e) => setWeirdInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addWeirdItem(weirdInput);
                setWeirdInput('');
              }
            }}
            placeholder="e.g. miso paste"
            className="flex-1 rounded-full border border-ink/15 bg-white/80 px-4 py-2 text-sm outline-none focus:border-tomato"
          />
          <button
            className="btn-ghost"
            onClick={() => {
              addWeirdItem(weirdInput);
              setWeirdInput('');
            }}
          >
            Add
          </button>
        </div>
        {pantry.weirdDrawer.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pantry.weirdDrawer.map((w) => (
              <button
                key={w}
                onClick={() => removeWeirdItem(w)}
                className="chip chip--active"
                title="Click to remove"
              >
                {w} ×
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-ink/60">
          {pantry.items.length} items · {pantry.weirdDrawer.length} weird
        </span>
        <button
          className="btn-primary"
          disabled={pantry.items.length === 0 && pantry.weirdDrawer.length === 0}
          onClick={next}
        >
          Pick a chef →
        </button>
      </div>
    </section>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
