import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Genkit instance configured to use Google AI as the primary provider.
 * This ensures maximum stability and compatibility with the Next.js App Router environment.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY || '',
    }),
  ],
  // Default high-performance model for financial reasoning.
  model: 'googleai/gemini-2.0-flash-001',
});
