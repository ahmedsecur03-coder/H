
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * When an error is received, it throws it to be caught by Next.js's global error boundary
 * (e.g., error.tsx or global-error.tsx), making debugging of security rules much easier
 * by showing a detailed overlay in development.
 */
export function FirebaseErrorListener() {
  // The state holds the error that needs to be thrown.
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // Define the handler for the 'permission-error' event.
    // The event emitter is strongly typed, so `err` is known to be FirestorePermissionError.
    const handleError = (err: FirestorePermissionError) => {
      // Set the error in the component's state. This will trigger a re-render.
      setError(err);
    };

    // Subscribe the handler to the event emitter.
    errorEmitter.on('permission-error', handleError);

    // Return a cleanup function to unsubscribe when the component unmounts.
    // This is crucial to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  // If the `error` state is not null (i.e., an error has been set),
  // throw it during the render phase. Next.js will catch this and display
  // its error overlay, which includes the rich, contextual information
  // from our custom FirestorePermissionError.
  if (error) {
    throw error;
  }

  // This component renders nothing to the DOM. Its only purpose is to
  // bridge the event emitter with React's error handling mechanism.
  return null;
}
