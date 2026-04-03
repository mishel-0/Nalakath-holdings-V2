
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Genkit instance configured to use OpenRouter as the primary AI provider.
 * Updated to use the Qwen 3.6 Plus (Free) model for specialized financial reasoning.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
  // Using Qwen 3.6 Plus via OpenRouter as requested
  model: 'openai/qwen/qwen3.6-plus:free',
});
