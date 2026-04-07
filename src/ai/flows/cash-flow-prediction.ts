'use server';
/**
 * @fileOverview This file defines a Genkit flow for predicting cash flow shortages or surpluses.
 *
 * - predictCashFlow - A function that handles the cash flow prediction process.
 * - CashFlowPredictionInput - The input type for the predictCashFlow function.
 * - CashFlowPredictionOutput - The return type for the predictCashFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CashFlowPredictionInputSchema = z.object({
  currentCashBalance: z.number().describe('The current cash balance of the company.'),
  projectedTransactions: z.array(
    z.object({
      description: z.string().describe('Description of the transaction.'),
      type: z.enum(['income', 'expense']).describe('Type of transaction: "income" or "expense".'),
      amount: z.number().describe('Amount of the transaction.'),
      date: z.string().datetime().describe('ISO 8601 formatted date when the transaction is expected to occur.'),
    })
  ).describe('A sorted list (by date) of all known and projected future transactions within the prediction period.'),
  predictionPeriodDays: z.number().min(7).max(365).default(28).describe('The number of days into the future to predict cash flow from today.'),
  todayDate: z.string().datetime().describe('The current date in ISO 8601 format to establish the starting point for predictions.'),
  companyContext: z.string().optional().describe('Optional context about the company or division.'),
  model: z.string().optional().describe('The AI model to use for generation via OpenRouter.'),
});
export type CashFlowPredictionInput = z.infer<typeof CashFlowPredictionInputSchema>;

const CashFlowPredictionOutputSchema = z.object({
  predictionSummary: z.string().describe('A comprehensive summary of the cash flow prediction.'),
  potentialShortageDetected: z.boolean().describe('True if any cash flow shortage is predicted.'),
  detailsOfShortage: z.array(
    z.object({
      predictedDate: z.string().datetime().describe('The ISO 8601 formatted date of the shortage.'),
      amount: z.number().describe('The predicted amount of the shortage.'),
    })
  ).optional(),
  potentialSurplusDetected: z.boolean().describe('True if a significant cash flow surplus is predicted.'),
  detailsOfSurplus: z.array(
    z.object({
      predictedDate: z.string().datetime().describe('The ISO 8601 formatted date of the surplus.'),
      amount: z.number().describe('The predicted amount of the surplus.'),
    })
  ).optional(),
  recommendations: z.array(z.string()).optional().describe('Actionable recommendations.'),
});
export type CashFlowPredictionOutput = z.infer<typeof CashFlowPredictionOutputSchema>;

export async function predictCashFlow(input: CashFlowPredictionInput): Promise<CashFlowPredictionOutput> {
  return cashFlowPredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cashFlowPredictionPrompt',
  input: {schema: CashFlowPredictionInputSchema},
  output: {schema: CashFlowPredictionOutputSchema},
  prompt: `You are an expert financial analyst. Your task is to analyze the provided financial data and predict cash flow for a company over a specified period.\n\nToday's Date: {{{todayDate}}}\nCurrent Cash Balance: $ {{currentCashBalance}}\nPrediction Period: {{{predictionPeriodDays}}} days from today.\n\nProjected Transactions (sorted by date):\n{{#each projectedTransactions}}\n- Date: {{{date}}}, Type: {{{type}}}, Amount: $ {{amount}}, Description: {{{description}}}\n{{/each}}\n\n{{#if companyContext}}\nCompany Context: {{{companyContext}}}\n{{/if}}\n\nPerform a day-by-day cash flow projection for the next {{{predictionPeriodDays}}} days.\nIdentify any dates where the cash balance is projected to fall below $0 (a shortage) or reach a significantly high level.\nProvide a summary of your findings, detailed specific dates and amounts for identified shortages or surpluses, and actionable recommendations.\n`,
});

const cashFlowPredictionFlow = ai.defineFlow(
  {
    name: 'cashFlowPredictionFlow',
    inputSchema: CashFlowPredictionInputSchema,
    outputSchema: CashFlowPredictionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, {
      model: input.model ? (input.model.startsWith('openai/') ? input.model : `openai/${input.model}`) : undefined
    });
    return output!;
  }
);
