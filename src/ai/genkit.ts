
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Genkit instance configured for Nalakath Holdings high-performance reasoning.
 * Uses the OpenAI plugin pointing to OpenRouter's API.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY || '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',
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
