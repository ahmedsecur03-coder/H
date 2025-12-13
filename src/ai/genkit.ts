import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

function configureGoogleAI(): Plugin<any>[] {
  if (process.env.GEMINI_API_KEY) {
    console.log("Configuring Google AI plugin...");
    return [googleAI({ apiKey: process.env.GEMINI_API_KEY })];
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.warn("GEMINI_API_KEY is not set. AI-related features will be disabled. This is expected for local development.");
  }
  
  return [];
}

const plugins = configureGoogleAI();

export const ai = genkit({
  plugins,
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
