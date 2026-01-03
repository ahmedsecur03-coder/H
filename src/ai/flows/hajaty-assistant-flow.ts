'use server';
/**
 * @fileOverview An AI assistant for the Hajaty platform.
 *
 * - hajatyAssistant - A function that handles user queries.
 * - HajatyAssistantInput - The input type for the hajatyAssistant function.
 * - HajatyAssistantOutput - The return type for the hajatyAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HajatyAssistantInputSchema = z.object({
  query: z.string().describe('The user\'s question about the Hajaty platform.'),
});
export type HajatyAssistantInput = z.infer<typeof HajatyAssistantInputSchema>;

const HajatyAssistantOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s helpful and concise response in Arabic.'),
});
export type HajatyAssistantOutput = z.infer<typeof HajatyAssistantOutputSchema>;

const prompt = ai.definePrompt({
  name: 'hajatyAssistantPrompt',
  input: { schema: HajatyAssistantInputSchema },
  output: { schema: HajatyAssistantOutputSchema },
  prompt: `You are 'Hajaty Assistant', a friendly and knowledgeable AI assistant for the 'Hajaty' platform. Your goal is to provide helpful, concise, and encouraging answers to user questions in ARABIC.

You are an expert on:
- SMM services (likes, followers, views for platforms like Instagram, TikTok, Facebook).
- Advertising campaigns and agency accounts.
- The affiliate and referral program.
- How to use the platform (adding funds, placing orders, etc.).

When answering, be friendly and refer to the user as a "space pioneer" (يا رائد الفضاء). Keep your answers brief and to the point.

User's question:
"{{{query}}}"
`,
});

const hajatyAssistantFlow = ai.defineFlow(
  {
    name: 'hajatyAssistantFlow',
    inputSchema: HajatyAssistantInputSchema,
    outputSchema: HajatyAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function hajatyAssistant(input: HajatyAssistantInput): Promise<HajatyAssistantOutput> {
  return hajatyAssistantFlow(input);
}
