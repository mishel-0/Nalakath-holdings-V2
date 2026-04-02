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
  ).describe('A sorted list (by date) of all known and projected future transactions within the prediction period. Recurring transactions should be explicitly expanded into individual entries within this list.'),
  predictionPeriodDays: z.number().min(7).max(365).default(28).describe('The number of days into the future to predict cash flow from today.'),
  todayDate: z.string().datetime().describe('The current date in ISO 8601 format to establish the starting point for predictions.'),
  companyContext: z.string().optional().describe('Optional context about the company or division, e.g., industry, current projects, general financial health.'),
});
export type CashFlowPredictionInput = z.infer<typeof CashFlowPredictionInputSchema>;

const CashFlowPredictionOutputSchema = z.object({
  predictionSummary: z.string().describe('A comprehensive summary of the cash flow prediction for the specified period, including key insights and potential issues.'),
  potentialShortageDetected: z.boolean().describe('True if any cash flow shortage is predicted within the period, false otherwise.'),
  detailsOfShortage: z.array(
    z.object({
      predictedDate: z.string().datetime().describe('The ISO 8601 formatted date when the shortage is predicted to occur.'),
      amount: z.number().describe('The predicted amount of the shortage on this date.'),
    })
  ).optional().describe('Details of each predicted cash flow shortage, if any.'),
  potentialSurplusDetected: z.boolean().describe('True if a significant cash flow surplus is predicted within the period, false otherwise.'),
  detailsOfSurplus: z.array(
    z.object({
      predictedDate: z.string().datetime().describe('The ISO 8601 formatted date when a significant surplus is predicted to occur.'),
      amount: z.number().describe('The predicted amount of the surplus on this date.'),
    })
  ).optional().describe('Details of each predicted cash flow surplus, if any.'),
  recommendations: z.array(z.string()).optional().describe('Actionable recommendations to address predicted cash flow issues or optimize surpluses.'),
});
export type CashFlowPredictionOutput = z.infer<typeof CashFlowPredictionOutputSchema>;

export async function predictCashFlow(input: CashFlowPredictionInput): Promise<CashFlowPredictionOutput> {
  return cashFlowPredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cashFlowPredictionPrompt',
  input: {schema: CashFlowPredictionInputSchema},
  output: {schema: CashFlowPredictionOutputSchema},
  prompt: `You are an expert financial analyst. Your task is to analyze the provided financial data and predict cash flow for a company over a specified period.\n\nToday's Date: {{{todayDate}}}\nCurrent Cash Balance: $ {{currentCashBalance}}\nPrediction Period: {{{predictionPeriodDays}}} days from today.\n\nProjected Transactions (sorted by date):\n{{#each projectedTransactions}}\n- Date: {{{date}}}, Type: {{{type}}}, Amount: $ {{amount}}, Description: {{{description}}}\n{{/each}}\n\n{{#if companyContext}}\nCompany Context: {{{companyContext}}}\n{{/if}}\n\nPerform a day-by-day cash flow projection for the next {{{predictionPeriodDays}}} days.\nIdentify any dates where the cash balance is projected to fall below $0 (a shortage) or reach a significantly high level (a surplus, e.g., exceeding 150% of the current balance or a sustained large positive balance).\nProvide a summary of your findings, detailed specific dates and amounts for identified shortages or surpluses, and actionable recommendations.\n\nConsider the impact of the projected transactions on the cash balance over time.\nIf a shortage is predicted, suggest specific actions to mitigate it (e.g., delay expenses, accelerate income collection).\nIf a significant surplus is predicted, suggest how to optimize it (e.g., invest, repay debt).\nFocus on practical and clear recommendations.\n`,
});

const cashFlowPredictionFlow = ai.defineFlow(
  {
    name: 'cashFlowPredictionFlow',
    inputSchema: CashFlowPredictionInputSchema,
    outputSchema: CashFlowPredictionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
