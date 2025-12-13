'use client';

/**
 * @fileoverview This file contains AI-related utilities that are safe to use on the client-side.
 */

/**
 * Checks if the AI (Gemini) API key is configured in the environment variables.
 * This is safe to call from the client because it only checks for the presence of the key,
 * not the key itself, and process.env variables are handled by Next.js.
 * @returns {boolean} True if the API key is set, false otherwise.
 */
export function isAiConfigured(): boolean {
  // During the build process, Next.js replaces `process.env.GEMINI_API_KEY`
  // with its value. We just need to check if that value is a non-empty string.
  // We double-negate it to ensure it returns a clean boolean.
  return !!process.env.NEXT_PUBLIC_GEMINI_API_KEY_CONFIGURED;
}
