import type { Request, Response } from 'express';
import { mockSeasonalBrief } from '../ai/mock.js';
import { isMockMode } from '../ai/client.js';

// Call ⑦ — Claude web_search → what's in season right now.
export async function seasonalBrief(_req: Request, res: Response): Promise<void> {
  if (isMockMode()) {
    res.json({ ok: true, data: mockSeasonalBrief() });
    return;
  }
  res.status(501).json({ ok: false, error: 'Real seasonal-brief call not wired yet.' });
}
