'use server';

/**
 * @fileOverview This file defines the AI support user flow for the application.
 *
 * - aiSupportUsers - A function that provides AI support to users.
 * - AISupportUsersInput - The input type for the aiSupportUsers function.
 * - AISupportUsersOutput - The return type for the aiSupportUsers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AISupportUsersInputSchema = z.object({
  query: z.string().describe('The user query for AI support.'),
});
export type AISupportUsersInput = z.infer<typeof AISupportUsersInputSchema>;

const AISupportUsersOutputSchema = z.object({
  response: z.string().describe('The AI support response to the user query.'),
});
export type AISupportUsersOutput = z.infer<typeof AISupportUsersOutputSchema>;

export async function aiSupportUsers(input: AISupportUsersInput): Promise<AISupportUsersOutput> {
  return aiSupportUsersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSupportUsersPrompt',
  input: {schema: AISupportUsersInputSchema},
  output: {schema: AISupportUsersOutputSchema},
  prompt: `You are an AI assistant designed to help users with the Hajaty Hub platform.
  Your responses should be in Arabic, and you should be able to answer question about SMM, ad campaigns, affiliate programs, and user accounts.
  
  User Query: {{{query}}}`,
});

const aiSupportUsersFlow = ai.defineFlow(
  {
    name: 'aiSupportUsersFlow',
    inputSchema: AISupportUsersInputSchema,
    outputSchema: AISupportUsersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
