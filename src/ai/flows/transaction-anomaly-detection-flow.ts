'use server';
/**
 * @fileOverview A Genkit flow for detecting unusual or potentially fraudulent transactions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  transactionId: z.string(),
  date: z.string(),
  amount: z.number(),
  description: z.string(),
  account: z.string(),
  category: z.string(),
});

const DetectTransactionAnomalyInputSchema = z.object({
  currentTransaction: TransactionSchema,
  historicalTransactions: z.array(TransactionSchema).optional(),
  model: z.string().optional(),
});
export type DetectTransactionAnomalyInput = z.infer<typeof DetectTransactionAnomalyInputSchema>;

const DetectTransactionAnomalyOutputSchema = z.object({
  isAnomaly: z.boolean(),
  reason: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  confidence: z.number(),
});
export type DetectTransactionAnomalyOutput = z.infer<typeof DetectTransactionAnomalyOutputSchema>;

export async function detectTransactionAnomaly(input: DetectTransactionAnomalyInput): Promise<DetectTransactionAnomalyOutput> {
  return transactionAnomalyDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transactionAnomalyDetectionPrompt',
  input: {schema: DetectTransactionAnomalyInputSchema},
  output: {schema: DetectTransactionAnomalyOutputSchema},
  prompt: `Review this transaction for fiscal anomalies:
ID: {{{currentTransaction.transactionId}}}
Amount: ₹{{{currentTransaction.amount}}}
Description: {{{currentTransaction.description}}}

Historical context:
{{#if historicalTransactions}}
{{#each historicalTransactions}}
- ₹{{this.amount}}: {{this.description}}
{{/each}}
{{/if}}`,
});

const transactionAnomalyDetectionFlow = ai.defineFlow(
  {
    name: 'transactionAnomalyDetectionFlow',
    inputSchema: DetectTransactionAnomalyInputSchema,
    outputSchema: DetectTransactionAnomalyOutputSchema,
  },
  async (input) => {
    const modelToUse = input.model?.replace('openai/', '') || 'googleai/gemini-2.0-flash-001';
    const {output} = await prompt(input, {
      model: modelToUse
    });
    return output!;
  }
);
