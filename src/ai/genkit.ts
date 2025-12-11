import {genkit, Plugin} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Helper to conditionally enable the Google AI plugin
function configureGoogleAI(): Plugin<any> | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    console.log("Configuring Google AI plugin...");
    return googleAI({ apiKey });
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
  model: 'googleai/gemini-pro-vision',
  // Allow passing a different model in generate() call.
  allowModelConversions: true
});
