import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Genkit instance configured to use OpenRouter via the OpenAI plugin.
 * This provides access to high-performance reasoning models like DeepSeek and Gemini.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
});
