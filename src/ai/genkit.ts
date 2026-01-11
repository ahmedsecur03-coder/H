'use server';
/**
 * @file This file is the entrypoint for Genkit settings for the application.
 */

import { generateBlogPostFlow } from '@/ai/flows/generate-blog-post-flow';
import { googleAI } from '@genkit-ai/google-genai';
import { genkit, configureGenkit } from 'genkit';

configureGenkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  flowStateStore: 'firebase',
  traceStore: 'firebase',
  enableTracingAndMetrics: true,
  logLevel: 'debug',
});

export const allFlows = {
  generateBlogPostFlow,
};

export const ai = genkit;
