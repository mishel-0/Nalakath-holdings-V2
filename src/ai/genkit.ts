import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit instance configured for high-performance financial reasoning.
 * Uses the Google AI plugin for native stability and speed.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
