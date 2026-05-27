import type { Request, Response } from 'express';
import { streamMockRecipe } from '../ai/mock.js';
import { isMockMode } from '../ai/client.js';
import { closeSse, openSse, sendSse } from './sse.js';
import type { RecipeGenerateRequest } from '../../shared/types.js';

// Call ⑤ — SSE. Eng 1: replace the mock branch with the real Anthropic streaming call.
export async function recipeGenerate(req: Request, res: Response): Promise<void> {
  const body = req.body as RecipeGenerateRequest;
  if (!body?.context) {
    res.status(400).json({ ok: false, error: 'Missing context' });
    return;
  }

  openSse(res);

  try {
    if (isMockMode()) {
      for await (const event of streamMockRecipe(body.context)) {
        sendSse(res, event);
      }
    } else {
      // TODO(eng1): real Claude call with tool use, persona prompt composition,
      // and chunked dishName/intro streaming per SPEC §6.
      sendSse(res, { type: 'error', error: 'Real Claude client not wired yet — set USE_MOCK_CLAUDE=true.' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown stream error';
    sendSse(res, { type: 'error', error: message });
  } finally {
    closeSse(res);
  }
}
