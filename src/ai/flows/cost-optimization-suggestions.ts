'use server';
/**
 * @fileOverview This file provides a Genkit flow for generating cost optimization suggestions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CostOptimizationSuggestionsInputSchema = z.object({
  companyName: z.string(),
  financialSummary: z.object({
    netProfit: z.number(),
    totalRevenue: z.number(),
    totalExpenses: z.number(),
    profitMargin: z.number(),
  }),
  spendingAnalysis: z.object({
    topExpenseCategories: z.array(z.object({
      category: z.string(),
      amount: z.number(),
      percentageOfTotalExpenses: z.number(),
    })),
    projectSpendingOverview: z.array(z.object({
      projectName: z.string(),
      budget: z.number(),
      actualSpent: z.number(),
      variance: z.number(),
      status: z.string(),
    })),
  }),
  recentInsights: z.array(z.string()).optional(),
  model: z.string().optional(),
});
export type CostOptimizationSuggestionsInput = z.infer<typeof CostOptimizationSuggestionsInputSchema>;

const CostOptimizationSuggestionsOutputSchema = z.object({
  overallSummary: z.string().optional(),
  suggestions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['Cost Reduction', 'Efficiency Improvement', 'Process Optimization', 'Negotiation', 'Waste Reduction', 'Strategic Reallocation', 'Technology Adoption']),
    estimatedImpact: z.string().optional(),
    actionableSteps: z.array(z.string()).optional(),
  })),
});
export type CostOptimizationSuggestionsOutput = z.infer<typeof CostOptimizationSuggestionsOutputSchema>;

export async function costOptimizationSuggestions(input: CostOptimizationSuggestionsInput): Promise<CostOptimizationSuggestionsOutput> {
  return costOptimizationSuggestionsFlow(input);
}

const costOptimizationSuggestionsPrompt = ai.definePrompt({
  name: 'costOptimizationSuggestionsPrompt',
  input: { schema: CostOptimizationSuggestionsInputSchema },
  output: { schema: CostOptimizationSuggestionsOutputSchema },
  prompt: `You are a seasoned financial analyst. Analyze financial data for {{companyName}} and provide concrete cost optimization suggestions.

--- Financial Summary ---
Net Profit: {{{financialSummary.netProfit}}}
Total Revenue: {{{financialSummary.totalRevenue}}}
Total Expenses: {{{financialSummary.totalExpenses}}}
Profit Margin: {{{financialSummary.profitMargin}}}%

--- Spending Analysis ---
Top Expense Categories:
{{#each spendingAnalysis.topExpenseCategories}}
- Category: {{{category}}}, Amount: {{{amount}}}, Percentage of Total: {{{percentageOfTotalExpenses}}}%
{{/each}}`,
});

const costOptimizationSuggestionsFlow = ai.defineFlow(
  {
    name: 'costOptimizationSuggestionsFlow',
    inputSchema: CostOptimizationSuggestionsInputSchema,
    outputSchema: CostOptimizationSuggestionsOutputSchema,
  },
  async (input) => {
    // Standardize model resolution to prevent NOT_FOUND errors
    const modelToUse = input.model?.replace('openai/', '') || 'googleai/gemini-2.0-flash-001';
    const { output } = await costOptimizationSuggestionsPrompt(input, {
      model: modelToUse
    });
    return output!;
  }
);
