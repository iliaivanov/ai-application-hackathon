import type { Request, Response } from 'express';
import { mockFridgeScan } from '../ai/mock.js';
import { isMockMode } from '../ai/client.js';
import type { FridgeScanRequest } from '../../shared/types.js';

// Call ① — Eng 3 will swap in real Claude Vision.
export async function visionFridge(req: Request, res: Response): Promise<void> {
  const body = req.body as FridgeScanRequest;
  if (!body?.imageBase64) {
    res.status(400).json({ ok: false, error: 'Missing imageBase64' });
    return;
  }
  if (isMockMode()) {
    res.json({ ok: true, data: mockFridgeScan() });
    return;
  }
  res.status(501).json({ ok: false, error: 'Real vision call not wired yet.' });
}
