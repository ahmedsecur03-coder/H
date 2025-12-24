
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { SystemLog } from '@/lib/types';


export function FirebaseErrorListener() {
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      // Log the detailed error to the console instead of throwing it.
      // This prevents the Next.js error overlay from appearing.
      console.error("Firestore Permission Error Caught:", err);
      
      // Optionally, still log to the backend for monitoring purposes
      if (firestore) {
        const logData: Omit<SystemLog, 'id'> = {
            event: 'permission_denied',
            level: 'error',
            message: `Permission denied for user ${user?.uid || 'anonymous'} on path ${err.request.path}`,
            timestamp: new Date().toISOString(),
            metadata: {
                userId: user?.uid || 'anonymous',
                request: {
                  auth: err.request.auth,
                  method: err.request.method,
                  path: err.request.path,
                  ...(err.request.resource ? { resource: err.request.resource } : {}),
                }
            },
        };
        const logsCollection = collection(firestore, 'systemLogs');
        addDoc(logsCollection, logData).catch(logError => {
            console.error("Failed to write to systemLogs:", logError);
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [firestore, user]);

  // This component no longer throws errors, so it doesn't render anything that could crash the app.
  return null;
}
