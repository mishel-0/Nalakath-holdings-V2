import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for Nalakath Holdings.
 * Uses the openAI plugin pointing to OpenRouter with the provided key.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
