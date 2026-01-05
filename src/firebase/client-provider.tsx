'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/init';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    // This check ensures firebase is only initialized on the client-side.
    if (typeof window !== 'undefined') {
        if (!firebaseServices) {
            setFirebaseServices(initializeFirebase());
        }
    }
  }, [firebaseServices]);

  if (!firebaseServices) {
    // Render children without the provider on the server or before initialization.
    return <>{children}</>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
