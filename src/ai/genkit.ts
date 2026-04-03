
import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * Genkit instance configured to use OpenRouter as the primary AI provider.
 * Uses the Qwen 3.6 Plus (Free) model via the OpenAI-compatible interface.
 */
export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
  // The model identifier for the OpenAI provider.
  // When using OpenRouter, we specify the full model ID prefixed by 'openai/'.
  model: 'openai/qwen/qwen3.6-plus:free',
});
