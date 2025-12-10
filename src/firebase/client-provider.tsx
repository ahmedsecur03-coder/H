'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useAuth, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

function AnonymousSignInManager() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // If auth is initialized, not loading, and there's no user, sign in anonymously.
    if (auth && !isUserLoading && !user) {
      signInAnonymously(auth).catch(error => {
        console.error("Anonymous sign-in failed:", error);
      });
    }
  }, [auth, user, isUserLoading]);

  return null; // This component does not render anything.
}


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <AnonymousSignInManager />
      {children}
    </FirebaseProvider>
  );
}
