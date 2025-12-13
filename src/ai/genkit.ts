import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Helper to check if the AI service is configured
export function isAiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

// Helper to conditionally enable the Google AI plugin
function configureGoogleAI(): Plugin<any> | null {
  if (isAiConfigured()) {
    console.log("Configuring Google AI plugin...");
    return googleAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  console.warn("GEMINI_API_KEY is not set. Google AI plugin will be disabled.");
  return null;
}

const googleAIPlugin = configureGoogleAI();

export const ai = genkit({
  plugins: [
    // Conditionally include the plugin only if it's configured
    ...(googleAIPlugin ? [googleAIPlugin] : []),
  ],
  // We still define a default model so genkit doesn't complain,
  // but calls will fail if the plugin is not available.
  // We will guard against this in the UI.
  model: 'googleai/gemini-pro-vision',
  // Allow passing a different model in generate() call.
  allowModelConversions: true
});
