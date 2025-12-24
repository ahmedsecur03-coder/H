
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import type { SystemLog } from '@/lib/types';


export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      setError(err);
      
      // Log the permission error to the systemLogs collection if firestore is available
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
                  // Ensure resource data is not undefined before including it
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

  if (error) {
    throw error;
  }

  return null;
}
