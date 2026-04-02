'use server';
/**
 * @fileOverview This file provides a Genkit flow for generating cost optimization suggestions.
 *
 * - costOptimizationSuggestions - A function that analyzes spending patterns and provides actionable cost-saving recommendations.
 * - CostOptimizationSuggestionsInput - The input type for the costOptimizationSuggestions function.
 * - CostOptimizationSuggestionsOutput - The return type for the costOptimizationSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CostOptimizationSuggestionsInputSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  financialSummary: z.object({
    netProfit: z.number().describe('Current net profit.'),
    totalRevenue: z.number().describe('Total revenue.'),
    totalExpenses: z.number().describe('Total expenses.'),
    profitMargin: z.number().describe('Current profit margin as a percentage.'),
  }).describe('Overall financial summary.'),
  spendingAnalysis: z.object({
    topExpenseCategories: z.array(z.object({
      category: z.string().describe('Name of the expense category.'),
      amount: z.number().describe('Total amount spent in this category.'),
      percentageOfTotalExpenses: z.number().describe('Percentage of total expenses this category represents.'),
    })).describe('Top expense categories by amount.'),
    projectSpendingOverview: z.array(z.object({
      projectName: z.string().describe('Name of the project.'),
      budget: z.number().describe('Allocated budget for the project.'),
      actualSpent: z.number().describe('Actual amount spent on the project.'),
      variance: z.number().describe('Difference between actual spent and budget.'),
      status: z.string().describe('Current status of the project (e.g., "On Track", "Over Budget", "Completed").'),
    })).describe('Overview of spending per project.'),
  }).describe('Detailed analysis of spending patterns.'),
  recentInsights: z.array(z.string()).optional().describe('Any recent insights or anomalies detected by other systems.'),
});
export type CostOptimizationSuggestionsInput = z.infer<typeof CostOptimizationSuggestionsInputSchema>;

const CostOptimizationSuggestionsOutputSchema = z.object({
  overallSummary: z.string().optional().describe('A brief overall summary or introductory remark for the suggestions.'),
  suggestions: z.array(z.object({
    title: z.string().describe('A concise title for the suggestion.'),
    description: z.string().describe('Detailed explanation of the suggestion and how to implement it.'),
    category: z.enum(['Cost Reduction', 'Efficiency Improvement', 'Process Optimization', 'Negotiation', 'Waste Reduction', 'Strategic Reallocation', 'Technology Adoption']).describe('The category of the suggestion.'),
    estimatedImpact: z.string().optional().describe('Estimated financial or operational impact of implementing this suggestion (e.g., "Save $5,000/month", "Reduce labor hours by 10%").'),
    actionableSteps: z.array(z.string()).optional().describe('Specific, actionable steps to implement the suggestion.'),
  })).describe('A list of actionable cost optimization suggestions.'),
});
export type CostOptimizationSuggestionsOutput = z.infer<typeof CostOptimizationSuggestionsOutputSchema>;

export async function costOptimizationSuggestions(input: CostOptimizationSuggestionsInput): Promise<CostOptimizationSuggestionsOutput> {
  return costOptimizationSuggestionsFlow(input);
}

const costOptimizationSuggestionsPrompt = ai.definePrompt({
  name: 'costOptimizationSuggestionsPrompt',
  input: { schema: CostOptimizationSuggestionsInputSchema },
  output: { schema: CostOptimizationSuggestionsOutputSchema },
  prompt: `You are a seasoned financial analyst and cost optimization consultant for a multi-division company.
Your goal is to analyze the provided financial data and spending patterns for {{companyName}} and provide concrete, actionable suggestions to improve profitability and enhance financial health. Focus on identifying inefficiencies, areas of high expenditure, and potential cost-saving opportunities.

--- Financial Summary ---
Net Profit: {{{financialSummary.netProfit}}}
Total Revenue: {{{financialSummary.totalRevenue}}}
Total Expenses: {{{financialSummary.totalExpenses}}}
Profit Margin: {{{financialSummary.profitMargin}}}%

--- Spending Analysis ---
Top Expense Categories:
{{#each spendingAnalysis.topExpenseCategories}}
- Category: {{{category}}}, Amount: {{{amount}}}, Percentage of Total: {{{percentageOfTotalExpenses}}}%
{{/each}}

Project Spending Overview:
{{#each spendingAnalysis.projectSpendingOverview}}
- Project: {{{projectName}}}, Budget: {{{budget}}}, Actual Spent: {{{actualSpent}}}, Variance: {{{variance}}}, Status: {{{status}}}
{{/each}}

{{#if recentInsights}}
--- Recent Insights/Anomalies ---
{{#each recentInsights}}
- {{{this}}}
{{/each}}
{{/if}}

Based on the above data, generate a list of actionable cost optimization suggestions. Each suggestion should include a title, a detailed description, a category (choose from 'Cost Reduction', 'Efficiency Improvement', 'Process Optimization', 'Negotiation', 'Waste Reduction', 'Strategic Reallocation', 'Technology Adoption'), an optional estimated impact, and specific actionable steps.
Also, provide an overall summary or introductory remark for your suggestions.
`,
});

const costOptimizationSuggestionsFlow = ai.defineFlow(
  {
    name: 'costOptimizationSuggestionsFlow',
    inputSchema: CostOptimizationSuggestionsInputSchema,
    outputSchema: CostOptimizationSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await costOptimizationSuggestionsPrompt(input);
    return output!;
  }
);
