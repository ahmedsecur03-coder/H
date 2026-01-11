'use server';
/**
 * @file This file is the entrypoint for Genkit settings for the application.
 */

import { generateBlogPostFlow } from '@/ai/flows/generate-blog-post-flow';
import { generateAffiliatePostFlow } from '@/ai/flows/generate-affiliate-post-flow';
import { ai } from './ai';

export const allFlows = {
  generateBlogPostFlow,
  generateAffiliatePostFlow,
};

// Re-export ai for simplicity, though direct import from @/ai/ai is preferred
export { ai };
