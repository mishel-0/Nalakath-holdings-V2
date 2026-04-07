import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit instance configured to use the official Google AI plugin.
 * This provides stable access to high-performance Gemini models.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
