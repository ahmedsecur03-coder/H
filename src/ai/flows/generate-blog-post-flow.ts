'use server';
/**
 * @fileOverview An AI flow for generating blog posts.
 *
 * - generateBlogPost - A function that handles the blog post generation process.
 * - GenerateBlogPostInput - The input type for the generateBlogPost function.
 * - GenerateBlogPostOutput - The return type for the generateBlogPost function.
 */

import { ai } from '@/ai/ai';
import { z } from 'genkit';

export const GenerateBlogPostInputSchema = z.object({
  topic: z.string().describe('The topic for the blog post.'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

export const GenerateBlogPostOutputSchema = z.object({
  title: z.string().describe('The generated title of the blog post.'),
  content: z.string().describe('The generated content of the blog post in Markdown format.'),
});
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;

const prompt = ai.definePrompt(
  {
    name: 'generateBlogPostPrompt',
    input: { schema: GenerateBlogPostInputSchema },
    output: { schema: GenerateBlogPostOutputSchema },
    prompt: `You are an expert digital marketer and SEO specialist writing a blog post in Arabic.
Your audience is interested in SMM services, social media growth, and digital marketing.

Generate a compelling, SEO-optimized blog post about the following topic: {{{topic}}}.

The blog post should be:
- Written entirely in Arabic.
- Engaging, informative, and well-structured.
- Formatted using Markdown.
- Include a title, an introduction, several sub-headings (using ##), and a conclusion.
- Naturally incorporate keywords related to the topic.
- The content should be at least 300 words.
`,
  },
);

export const generateBlogPostFlow = ai.defineFlow(
  {
    name: 'generateBlogPostFlow',
    inputSchema: GenerateBlogPostInputSchema,
    outputSchema: GenerateBlogPostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateBlogPost(input: GenerateBlogPostInput): Promise<GenerateBlogPostOutput> {
  return generateBlogPostFlow(input);
}
