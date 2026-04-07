
import { genkit } from 'genkit';
import { openai } from 'genkitx-openai';

/**
 * Genkit instance configured for high-performance financial reasoning.
 * Uses the OpenAI plugin pointing to OpenRouter's high-performance endpoint.
 */
export const ai = genkit({
  plugins: [
    openai({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
