import type { Request, Response } from 'express';
import { mockPantryGap } from '../ai/mock.js';
import { isMockMode } from '../ai/client.js';

// Call ③ — pantry → gap detection nudge.
export async function pantryGap(_req: Request, res: Response): Promise<void> {
  if (isMockMode()) {
    res.json({ ok: true, data: mockPantryGap() });
    return;
  }
  res.status(501).json({ ok: false, error: 'Real pantry-gap call not wired yet.' });
}
