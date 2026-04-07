'use server';
/**
 * @fileOverview A Genkit flow for detecting unusual or potentially fraudulent transactions.
 *
 * - detectTransactionAnomaly - A function that handles the transaction anomaly detection process.
 * - DetectTransactionAnomalyInput - The input type for the detectTransactionAnomaly function.
 * - DetectTransactionAnomalyOutput - The return type for the detectTransactionAnomaly function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  transactionId: z.string().describe('Unique identifier for the transaction.'),
  date: z.string().describe('The date of the transaction in ISO format.'),
  amount: z.number().describe('The amount of the transaction.'),
  description: z.string().describe('A description of the transaction.'),
  account: z.string().describe('The account from which the transaction was made.'),
  category: z.string().describe('The category of the transaction.'),
});

const DetectTransactionAnomalyInputSchema = z.object({
  currentTransaction: TransactionSchema.describe('The transaction to be analyzed for anomalies.'),
  historicalTransactions: z.array(TransactionSchema).describe('Recent historical transactions for context.').optional(),
  model: z.string().optional().describe('The AI model to use for generation.'),
});
export type DetectTransactionAnomalyInput = z.infer<typeof DetectTransactionAnomalyInputSchema>;

const DetectTransactionAnomalyOutputSchema = z.object({
  isAnomaly: z.boolean().describe('True if the transaction is detected as an anomaly.'),
  reason: z.string().describe('Explanation for the determination.'),
  severity: z.enum(['low', 'medium', 'high']).describe('The severity of the detected anomaly.'),
  confidence: z.number().min(0.0).max(1.0).describe('A confidence score (0.0-1.0).'),
});
export type DetectTransactionAnomalyOutput = z.infer<typeof DetectTransactionAnomalyOutputSchema>;

export async function detectTransactionAnomaly(input: DetectTransactionAnomalyInput): Promise<DetectTransactionAnomalyOutput> {
  return transactionAnomalyDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transactionAnomalyDetectionPrompt',
  input: {schema: DetectTransactionAnomalyInputSchema},
  output: {schema: DetectTransactionAnomalyOutputSchema},
  prompt: `You are an expert financial analyst specializing in anomaly detection for accounting transactions. Your task is to review a new transaction and compare it against historical transactions to identify any unusual activity.

Analyze the following new transaction:
Transaction ID: {{{currentTransaction.transactionId}}}
Date: {{{currentTransaction.date}}}
Amount: {{{currentTransaction.amount}}}
Description: {{{currentTransaction.description}}}
Account: {{{currentTransaction.account}}}
Category: {{{currentTransaction.category}}}

Historical context:
{{#if historicalTransactions}}
{{#each historicalTransactions}}
- ID: {{this.transactionId}}, Date: {{this.date}}, Amount: {{this.amount}}, Category: {{this.category}}
{{/each}}
{{else}}
No historical transactions provided.
{{/if}}

Based on this information, determine if the new transaction is an anomaly. Provide a clear reason, assign a severity level, and express your confidence.`,
});

const transactionAnomalyDetectionFlow = ai.defineFlow(
  {
    name: 'transactionAnomalyDetectionFlow',
    inputSchema: DetectTransactionAnomalyInputSchema,
    outputSchema: DetectTransactionAnomalyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input, {
      model: input.model || undefined
    });
    return output!;
  }
);
