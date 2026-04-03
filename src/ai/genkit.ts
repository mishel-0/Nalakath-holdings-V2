
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';

/**
 * Genkit instance configured to use OpenRouter as the primary AI provider.
 * This setup allows for advanced financial analysis using top-tier models
 * like Gemini 2.0 Flash or GPT-4o via OpenRouter's unified API.
 */
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  ],
  // Using Gemini 2.0 Flash through OpenRouter for speed and high reasoning capability
  model: 'openai/google/gemini-2.0-flash-001',
});
