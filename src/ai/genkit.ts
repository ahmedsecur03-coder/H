import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI(), // Assumes GEMINI_API_KEY is in the environment
  ],
});
