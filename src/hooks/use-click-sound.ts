'use client';

import { useCallback } from 'react';

// A more subtle, futuristic click sound encoded as a Base64 data URI.
const CLICK_SOUND_DATA_URI = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export function useClickSound() {
  const playSound = useCallback(() => {
    try {
      const audio = new Audio(CLICK_SOUND_DATA_URI);
      audio.volume = 0.3; // Lower volume for a more subtle effect
      audio.play().catch(error => {
        // Silently ignore errors
      });
    } catch (e) {
      // Silently ignore errors
    }
  }, []);

  return playSound;
}
