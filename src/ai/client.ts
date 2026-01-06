'use client';

// Helper function to check if the Gemini API key is configured on the client.
export function isAiConfigured(): boolean {
  // This environment variable is set during the build process
  // and will be either 'true' or an empty string.
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY_CONFIGURED === 'true';
}
