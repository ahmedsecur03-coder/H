'use client';

import React, { useMemo, type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/init';
import { User } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);

  useEffect(() => {
    // This check ensures firebase is only initialized on the client-side.
    if (typeof window !== 'undefined') {
        setFirebaseServices(initializeFirebase());
    }
  }, []);

  // If services are not yet initialized (e.g., on the server or during initial client render),
  // we can render children but without the Firebase context.
  // The UserInitializer and other Firebase-dependent parts are handled within the layout,
  // so they will only activate when the context is available.
  if (!firebaseServices) {
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
