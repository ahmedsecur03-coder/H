'use client';

// Helper function to check if the Gemini API key is configured on the client.
export function isAiConfigured(): boolean {
  // We will temporarily always return true to ensure the component is visible.
  // In a real application, you would check for the presence of an API key
  // that is safely exposed to the client.
  return true;
}
