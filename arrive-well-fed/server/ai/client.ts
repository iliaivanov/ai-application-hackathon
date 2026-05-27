// Real Anthropic client wrapper. Eng 1 fills in the actual prompts and tool-use
// for call ⑤ here. For now, every endpoint defers to the mock client unless
// USE_MOCK_CLAUDE=false AND an API key is set.

import Anthropic from '@anthropic-ai/sdk';

let cached: Anthropic | null = null;

export function isMockMode(): boolean {
  if (process.env.USE_MOCK_CLAUDE === 'false') return false;
  if (!process.env.ANTHROPIC_API_KEY) return true;
  return process.env.USE_MOCK_CLAUDE !== 'false';
}

export function getClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Set USE_MOCK_CLAUDE=true to develop without a key.');
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

// Model IDs locked in SPEC §2.
export const MODELS = {
  recipe: 'claude-sonnet-4-5-20250929',
  vision: 'claude-sonnet-4-5-20250929',
  fast: 'claude-haiku-4-5-20251001',
} as const;
