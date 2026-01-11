'use server';
/**
 * @file This file is the entrypoint for Genkit settings for the application.
 */

import { generateBlogPost } from '@/ai/flows/generate-blog-post-flow';
import { generateAffiliatePost } from '@/ai/flows/generate-affiliate-post-flow';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { ai } from './ai';

export const allFlows = {
  generateBlogPost,
  generateAffiliatePost,
  generateImage,
};

// Re-export ai for simplicity, though direct import from @/ai/ai is preferred
export { ai };
