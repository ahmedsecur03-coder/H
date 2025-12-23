
import { genkit, type GenkitOptions } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const genkitOptions: GenkitOptions = {
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logSinks: [],
  enableTracingAndMetrics: true,
};

export const ai = genkit(genkitOptions);
