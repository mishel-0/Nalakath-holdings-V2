
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Genkit instance configured for high-performance financial reasoning.
 * Uses the OpenAI plugin pointing to OpenRouter's high-performance endpoint.
 * This provides access to reasoning models like DeepSeek R1 and Claude 3.5.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
