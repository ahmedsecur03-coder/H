'use server';
/**
 * @fileOverview A flow for generating a blog post using AI.
 *
 * - generateBlogPost - A function that handles the blog post generation process.
 * - GenerateBlogPostInput - The input type for the generateBlogPost function.
 * - GenerateBlogPostOutput - The return type for the generateBlogPost function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateBlogPostInputSchema = z.object({
  topic: z.string().describe('The topic of the blog post.'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

const GenerateBlogPostOutputSchema = z.object({
  title: z.string().describe('The catchy and SEO-friendly title of the blog post.'),
  content: z.string().describe('The full content of the blog post in Markdown format. It should be well-structured with headings, lists, and bold text where appropriate. The tone should be professional and engaging. The language must be Arabic.'),
});
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateBlogPostPrompt',
  input: { schema: GenerateBlogPostInputSchema },
  output: { schema: GenerateBlogPostOutputSchema },
  prompt: `أنت خبير في كتابة المحتوى والتسويق الرقمي. مهمتك هي كتابة مقالة احترافية وجذابة باللغة العربية حول الموضوع التالي: {{{topic}}}.

  يجب أن تكون المقالة:
  - ذات عنوان جذاب ومناسب لمحركات البحث (SEO).
  - مكتوبة بالكامل باللغة العربية.
  - منسقة بشكل جيد باستخدام Markdown (استخدم العناوين H2, H3، القوائم النقطية أو الرقمية، والنص العريض).
  - ذات محتوى غني ومفيد للقارئ.
  - ذات نبرة احترافية ومحفزة.
  
  قم بتوليد العنوان والمحتوى بناءً على هذه التعليمات.`,
});

const generateBlogPostFlow = ai.defineFlow(
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
