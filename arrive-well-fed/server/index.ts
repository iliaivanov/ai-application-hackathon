import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import { recipeGenerate } from './routes/recipe-generate.js';
import { recipeRetone } from './routes/recipe-retone.js';
import { recipeOneliner } from './routes/recipe-oneliner.js';
import { visionFridge } from './routes/vision-fridge.js';
import { workoutBrief } from './routes/workout-brief.js';
import { pantryGap } from './routes/pantry-gap.js';
import { personaSuggest } from './routes/persona-suggest.js';
import { seasonalBrief } from './routes/seasonal-brief.js';

const app = express();
app.use(express.json({ limit: '12mb' })); // fridge photos can be chunky

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, data: { status: 'alive', mock: process.env.USE_MOCK_CLAUDE !== 'false' } });
});

// 8 routes per SPEC §4
app.post('/api/vision/fridge', visionFridge); // ①
app.post('/api/workout/brief', workoutBrief); // ②
app.post('/api/pantry/gap', pantryGap); // ③
app.post('/api/persona/suggest', personaSuggest); // ④
app.post('/api/recipe/generate', recipeGenerate); // ⑤ (SSE)
app.post('/api/recipe/retone', recipeRetone); // ⑥ (SSE)
app.post('/api/seasonal/brief', seasonalBrief); // ⑦
app.post('/api/recipe/oneliner', recipeOneliner); // ⑧

// Uniform error envelope per SPEC §5 (Eng 1 rule).
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown server error';
  // eslint-disable-next-line no-console
  console.error('[server] error:', err);
  if (!res.headersSent) {
    res.status(500).json({ ok: false, error: message });
  }
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[server] Arrive Well-Fed API listening on http://localhost:${port} ` +
      `(mock=${process.env.USE_MOCK_CLAUDE !== 'false'})`,
  );
});
