import type { Request, Response } from 'express';
import { streamMockRetone } from '../ai/mock.js';
import { isMockMode } from '../ai/client.js';
import { closeSse, openSse, sendSse } from './sse.js';
import type { RecipeRetoneRequest } from '../../shared/types.js';

// Call ⑥ — SSE tone switch. Per SPEC §6 this only rewrites the language layer.
export async function recipeRetone(req: Request, res: Response): Promise<void> {
  const body = req.body as RecipeRetoneRequest;
  if (!body?.recipe || !body?.kind) {
    res.status(400).json({ ok: false, error: 'Missing recipe or kind' });
    return;
  }

  openSse(res);

  try {
    if (isMockMode()) {
      for await (const event of streamMockRetone(body.recipe, body.kind, body.newPersona)) {
        sendSse(res, event);
      }
    } else {
      sendSse(res, { type: 'error', error: 'Real Claude client not wired yet — set USE_MOCK_CLAUDE=true.' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown stream error';
    sendSse(res, { type: 'error', error: message });
  } finally {
    closeSse(res);
  }
}
