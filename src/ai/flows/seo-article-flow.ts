'use server';

/**
 * @fileOverview This file defines the AI flow for generating a long-form SEO-optimized article.
 *
 * - generateSeoArticle - A function that creates a blog post about a relevant digital marketing topic.
 * - SeoArticleInput - The input type for the generation function.
 * - SeoArticleOutput - The return type for the generation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SeoArticleInputSchema = z.object({
  topicSuggestion: z.string().describe('A suggestion for the article topic, e.g., "TikTok growth strategies".'),
});
export type SeoArticleInput = z.infer<typeof SeoArticleInputSchema>;

export const SeoArticleOutputSchema = z.object({
  title: z.string().describe('The final, catchy, SEO-optimized title for the blog post.'),
  content: z.string().describe('The full content of the blog post, written in Arabic, at least 800 words long, with markdown for formatting (headings, lists, etc.).'),
});
export type SeoArticleOutput = z.infer<typeof SeoArticleOutputSchema>;


export async function generateSeoArticle(input: SeoArticleInput): Promise<SeoArticleOutput> {
    return seoArticleFlow(input);
}


const prompt = ai.definePrompt({
  name: 'seoArticlePrompt',
  input: { schema: SeoArticleInputSchema },
  output: { schema: SeoArticleOutputSchema },
  prompt: `You are a world-class SEO expert and content writer for a digital services platform called "Hajaty Hub".
Your task is to write a long-form, comprehensive, and engaging blog post in ARABIC. The article must be at least 800 words.

You have analyzed the top competitors on Google for the topic: "{{{topicSuggestion}}}".

Based on your analysis, write a superior article that covers the topic in-depth. The article should be structured for high engagement and SEO ranking.

Instructions:
1.  **Title:** Create a compelling, SEO-friendly title in Arabic.
2.  **Introduction:** Start with a hook to grab the reader's attention and briefly introduce the topic's importance.
3.  **Body Content:**
    *   The body must be at least 800 words.
    *   Use Markdown for formatting: use headings (##), subheadings (###), bold text, and bulleted lists (*).
    *   Break down the topic into logical sections with clear headings.
    *   Include actionable tips, strategies, and insights. Make it practical and valuable for the reader.
    *   Incorporate relevant keywords naturally throughout the text.
4.  **Conclusion:** Summarize the key takeaways and end with a strong call-to-action, encouraging readers to use Hajaty Hub's services.
5.  **Language:** The entire output (title and content) MUST be in ARABIC.

Provide ONLY the JSON output with the 'title' and 'content' fields.`,
});


const seoArticleFlow = ai.defineFlow(
  {
    name: 'seoArticleFlow',
    inputSchema: SeoArticleInputSchema,
    outputSchema: SeoArticleOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
