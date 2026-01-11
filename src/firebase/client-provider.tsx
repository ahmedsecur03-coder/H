
'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/init';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// Store the initialized services in a variable at the module level
let firebaseServices: FirebaseServices | null = null;

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Use state to trigger re-render once services are confirmed, but initialize only once.
  const [services, setServices] = useState<FirebaseServices | null>(firebaseServices);

  useEffect(() => {
    // This check ensures firebase is only initialized on the client-side and only once.
    if (typeof window !== 'undefined' && !firebaseServices) {
        firebaseServices = initializeFirebase();
        setServices(firebaseServices);
    }
  }, []);

  // CRITICAL CHANGE: Do not render children until Firebase services are initialized.
  // This prevents any child component from trying to access a context that isn't ready.
  if (!services) {
    // You can render a global loader here if desired, but for now, returning null
    // is the safest way to prevent the error. The layout will still be present.
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
