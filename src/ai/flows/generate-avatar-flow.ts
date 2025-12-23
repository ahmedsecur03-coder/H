'use server';
/**
 * @fileOverview A flow for generating user avatars using AI.
 *
 * - generateAvatar - A function that handles the avatar generation process.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateAvatarInputSchema = z.object({
  prompt: z.string().describe('A detailed description of the desired avatar image.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  dataUri: z.string().describe("The generated image as a data URI. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (input) => {
    
    const finalPrompt = `sci-fi avatar for a user profile, digital art, epic, vibrant. Description: ${input.prompt}`;

    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: finalPrompt,
        config: {
            // You can add more specific configurations here if needed
            // e.g., aspectRatio: '1:1'
        }
    });

    if (!media.url) {
        throw new Error('Image generation failed to produce an output.');
    }

    // The URL from Imagen 4 is already a data URI
    return { dataUri: media.url };
  }
);
