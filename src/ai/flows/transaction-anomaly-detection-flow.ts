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
  account: z.string().describe('The account from which the transaction was made (e.g., checking, savings, credit card).'),
  category: z.string().describe('The category of the transaction (e.g., utilities, travel, office supplies).'),
});

const DetectTransactionAnomalyInputSchema = z.object({
  currentTransaction: TransactionSchema.describe('The transaction to be analyzed for anomalies.'),
  historicalTransactions: z.array(TransactionSchema).describe('A list of recent historical transactions for context and pattern identification.').optional(),
});
export type DetectTransactionAnomalyInput = z.infer<typeof DetectTransactionAnomalyInputSchema>;

const DetectTransactionAnomalyOutputSchema = z.object({
  isAnomaly: z.boolean().describe('True if the transaction is detected as an anomaly, false otherwise.'),
  reason: z.string().describe('Explanation for why the transaction is considered an anomaly, or why it is not.'),
  severity: z.enum(['low', 'medium', 'high']).describe('The severity of the detected anomaly.'),
  confidence: z.number().min(0.0).max(1.0).describe('A confidence score (0.0-1.0) for the anomaly detection.'),
});
export type DetectTransactionAnomalyOutput = z.infer<typeof DetectTransactionAnomalyOutputSchema>;

export async function detectTransactionAnomaly(input: DetectTransactionAnomalyInput): Promise<DetectTransactionAnomalyOutput> {
  return transactionAnomalyDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'transactionAnomalyDetectionPrompt',
  input: {schema: DetectTransactionAnomalyInputSchema},
  output: {schema: DetectTransactionAnomalyOutputSchema},
  prompt: `You are an expert financial analyst specializing in anomaly detection for accounting transactions. Your task is to review a new transaction and compare it against a set of historical transactions to identify any unusual or potentially fraudulent activity.

Focus on patterns related to:
- Transaction amounts (unusually high, low, or inconsistent with past trends for this category/account).
- Transaction descriptions (unusual keywords, vague descriptions).
- Transaction categories (transactions in unexpected categories for the account).
- Transaction frequency or timing.

Analyze the following new transaction:
Transaction ID: {{{currentTransaction.transactionId}}}
Date: {{{currentTransaction.date}}}
Amount: {{{currentTransaction.amount}}}
Description: {{{currentTransaction.description}}}
Account: {{{currentTransaction.account}}}
Category: {{{currentTransaction.category}}}

Here is a summary of recent historical transactions for context:
{{#if historicalTransactions}}
{{#each historicalTransactions}}
- ID: {{this.transactionId}}, Date: {{this.date}}, Amount: {{this.amount}}, Description: {{this.description}}, Account: {{this.account}}, Category: {{this.category}}
{{/each}}
{{else}}
No historical transactions provided for context.
{{/if}}

Based on this information, determine if the new transaction is an anomaly. Provide a clear reason for your determination, assign a severity level (low, medium, high), and express your confidence level (0.0 to 1.0).

Return the output in a JSON object matching the provided schema.`,
});

const transactionAnomalyDetectionFlow = ai.defineFlow(
  {
    name: 'transactionAnomalyDetectionFlow',
    inputSchema: DetectTransactionAnomalyInputSchema,
    outputSchema: DetectTransactionAnomalyOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
