
'use client';

// Helper function to check if the Gemini API key is configured on the client.
export function isAiConfigured(): boolean {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY_CONFIGURED === 'true';
}
