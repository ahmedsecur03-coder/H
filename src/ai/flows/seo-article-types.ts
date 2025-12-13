
import { z } from 'zod';

/**
 * @fileOverview This file defines the types and schemas for the SEO article generation flow.
 *
 * - SeoArticleInputSchema - The Zod schema for the input.
 * - SeoArticleInput - The TypeScript type inferred from the schema.
 * - SeoArticleOutputSchema - The Zod schema for the output.
 * - SeoArticleOutput - The TypeScript type inferred from the schema.
 */

export const SeoArticleInputSchema = z.object({
  topicSuggestion: z.string().describe('A suggestion for the article topic, e.g., "TikTok growth strategies".'),
});
export type SeoArticleInput = z.infer<typeof SeoArticleInputSchema>;

export const SeoArticleOutputSchema = z.object({
  title: z.string().describe('The final, catchy, SEO-optimized title for the blog post.'),
  content: z.string().describe('The full content of the blog post, written in Arabic, at least 800 words long, with markdown for formatting (headings, lists, etc.).'),
});
export type SeoArticleOutput = z.infer<typeof SeoArticleOutputSchema>;
