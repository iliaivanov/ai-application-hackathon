import type { Response } from 'express';
import type { RecipeStreamEvent } from '../../shared/types.js';

// Tiny SSE helper. Frontend reads these via `fetch` + ReadableStream rather
// than EventSource (POST body required).
export function openSse(res: Response): void {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}

export function sendSse(res: Response, event: RecipeStreamEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function closeSse(res: Response): void {
  res.write('event: end\ndata: {}\n\n');
  res.end();
}
