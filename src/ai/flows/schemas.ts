import { z } from 'genkit';

// Schema for generateAffiliatePost flow
export const GenerateAffiliatePostInputSchema = z.object({
  topic: z.string().describe('The topic or idea for the social media post.'),
  referralLink: z.string().url().describe('The affiliate referral link to include in the post.'),
});
export type GenerateAffiliatePostInput = z.infer<typeof GenerateAffiliatePostInputSchema>;

export const GenerateAffiliatePostOutputSchema = z.object({
  postContent: z.string().describe('The generated social media post content in Arabic, including the referral link and relevant hashtags.'),
});
export type GenerateAffiliatePostOutput = z.infer<typeof GenerateAffiliatePostOutputSchema>;


// Schema for generateBlogPost flow
export const GenerateBlogPostInputSchema = z.object({
  topic: z.string().describe('The topic for the blog post.'),
});
export type GenerateBlogPostInput = z.infer<typeof GenerateBlogPostInputSchema>;

export const GenerateBlogPostOutputSchema = z.object({
  title: z.string().describe('The generated title of the blog post.'),
  content: z.string().describe('The generated content of the blog post in Markdown format.'),
});
export type GenerateBlogPostOutput = z.infer<typeof GenerateBlogPostOutputSchema>;
