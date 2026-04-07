import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Genkit instance configured to use OpenRouter as the primary AI provider.
 * Uses the OpenAI plugin (v1.x) which is compatible with OpenRouter's API.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
  // Default model identifier for the OpenAI provider via OpenRouter.
  model: 'openai/qwen/qwen-3.6-plus:free',
});
