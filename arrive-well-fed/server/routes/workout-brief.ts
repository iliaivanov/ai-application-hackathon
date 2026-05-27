import type { Request, Response } from 'express';
import { mockNutritionBrief } from '../ai/mock.js';
import { isMockMode } from '../ai/client.js';
import type { WorkoutBriefRequest } from '../../shared/types.js';

// Call ② — workout log → structured nutrition brief.
export async function workoutBrief(req: Request, res: Response): Promise<void> {
  const body = req.body as WorkoutBriefRequest;
  if (isMockMode()) {
    res.json({ ok: true, data: mockNutritionBrief(body?.workout ?? null) });
    return;
  }
  res.status(501).json({ ok: false, error: 'Real workout brief call not wired yet.' });
}
