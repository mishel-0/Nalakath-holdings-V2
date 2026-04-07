'use server';
/**
 * @fileOverview This file defines a Genkit flow for predicting cash flow shortages or surpluses.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CashFlowPredictionInputSchema = z.object({
  currentCashBalance: z.number(),
  projectedTransactions: z.array(
    z.object({
      description: z.string(),
      type: z.enum(['income', 'expense']),
      amount: z.number(),
      date: z.string(),
    })
  ),
  predictionPeriodDays: z.number().default(30),
  todayDate: z.string(),
  companyContext: z.string().optional(),
  model: z.string().optional(),
});
export type CashFlowPredictionInput = z.infer<typeof CashFlowPredictionInputSchema>;

const CashFlowPredictionOutputSchema = z.object({
  predictionSummary: z.string(),
  potentialShortageDetected: z.boolean(),
  detailsOfShortage: z.array(z.any()).optional(),
  potentialSurplusDetected: z.boolean(),
  detailsOfSurplus: z.array(z.any()).optional(),
  recommendations: z.array(z.string()).optional(),
});
export type CashFlowPredictionOutput = z.infer<typeof CashFlowPredictionOutputSchema>;

export async function predictCashFlow(input: CashFlowPredictionInput): Promise<CashFlowPredictionOutput> {
  return cashFlowPredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cashFlowPredictionPrompt',
  input: {schema: CashFlowPredictionInputSchema},
  output: {schema: CashFlowPredictionOutputSchema},
  prompt: `You are an expert financial analyst. Predict cash flow for the next {{{predictionPeriodDays}}} days based on:
Today's Date: {{{todayDate}}}
Current Balance: ₹{{{currentCashBalance}}}

Transactions:
{{#each projectedTransactions}}
- {{{date}}}: {{{type}}} of ₹{{{amount}}} ({{{description}}})
{{/each}}`,
});

const cashFlowPredictionFlow = ai.defineFlow(
  {
    name: 'cashFlowPredictionFlow',
    inputSchema: CashFlowPredictionInputSchema,
    outputSchema: CashFlowPredictionOutputSchema,
  },
  async (input) => {
    const modelToUse = input.model?.replace('openai/', '') || 'googleai/gemini-2.0-flash-001';
    const {output} = await prompt(input, {
      model: modelToUse
    });
    return output!;
  }
);
