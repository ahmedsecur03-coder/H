
'use server';
/**
 * @fileOverview A flow for generating a user avatar image using AI.
 *
 * - generateAvatar - A function that handles the avatar generation process.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateAvatarInputSchema = z.object({
  prompt: z.string().describe('A detailed description of the desired avatar image. Should be space or cosmic themed.'),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  imageDataUri: z.string().describe("The generated image as a data URI (e.g., 'data:image/png;base64,...')."),
});
export type GenerateAvatarOutput = z.infer<typeof GenerateAvatarOutputSchema>;

// No prompt object is needed for pure image generation

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (input) => {
    // Enhance the prompt to ensure a consistent, high-quality, space-themed style.
    const enhancedPrompt = `cinematic, fantasy, space, cosmic, astronaut, close-up portrait of ${input.prompt}, professional illustration, epic, stunning, highly detailed, octane render, 8k`;

    const { media } = await ai.generate({
      model: 'googleai/imagen-2.0-fast-image-preview', // Using Imagen 2 for image generation
      prompt: enhancedPrompt,
      config: {
        // You can add specific image generation parameters here if needed
        // e.g., aspectRatio, numberOfImages, etc.
      }
    });

    if (!media.url) {
      throw new Error('Image generation failed to return a data URI.');
    }

    return {
      imageDataUri: media.url,
    };
  }
);


export async function generateAvatar(input: GenerateAvatarInput): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}
