import type { Request, Response } from 'express';
import { mockOneLiner } from '../ai/mock.js';
import { isMockMode } from '../ai/client.js';
import type { OneLinerRequest } from '../../shared/types.js';

// Call ⑧ — shareable one-liner caption above the screenshot frame.
export async function recipeOneliner(req: Request, res: Response): Promise<void> {
  const body = req.body as OneLinerRequest;
  if (!body?.recipe) {
    res.status(400).json({ ok: false, error: 'Missing recipe' });
    return;
  }
  if (isMockMode()) {
    res.json({ ok: true, data: mockOneLiner(body.recipe) });
    return;
  }
  res.status(501).json({ ok: false, error: 'Real one-liner call not wired yet.' });
}
