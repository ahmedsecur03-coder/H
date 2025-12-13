
import { z } from 'zod';

/**
 * @fileOverview This file defines the types and schemas for the AI support user flow.
 * 
 * - AISupportUsersInputSchema - The Zod schema for the input.
 * - AISupportUsersInput - The TypeScript type inferred from the schema.
 * - AISupportUsersOutputSchema - The Zod schema for the output.
 * - AISupportUsersOutput - The TypeScript type inferred from the schema.
 */

export const AISupportUsersInputSchema = z.object({
  query: z.string().describe('The user query for AI support.'),
});
export type AISupportUsersInput = z.infer<typeof AISupportUsersInputSchema>;

export const AISupportUsersOutputSchema = z.object({
  response: z.string().describe('The AI support response to the user query.'),
});
export type AISupportUsersOutput = z.infer<typeof AISupportUsersOutputSchema>;
