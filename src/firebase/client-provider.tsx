
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

function AppContent({ children }: { children: React.ReactNode }) {
    // This component now solely exists to render children after the provider is ready.
    // The FirebaseErrorListener is moved into FirebaseProvider to ensure context readiness.
    return <>{children}</>;
}


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

  if (!services) {
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      <AppContent>{children}</AppContent>
    </FirebaseProvider>
  );
}
