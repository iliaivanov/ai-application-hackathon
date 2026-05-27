import type { Request, Response } from 'express';
import { mockPersonaSuggest } from '../ai/mock.js';
import { isMockMode } from '../ai/client.js';

// Call ④ — mood + workout + history → suggested chef.
export async function personaSuggest(_req: Request, res: Response): Promise<void> {
  if (isMockMode()) {
    res.json({ ok: true, data: mockPersonaSuggest() });
    return;
  }
  res.status(501).json({ ok: false, error: 'Real persona-suggest call not wired yet.' });
}
