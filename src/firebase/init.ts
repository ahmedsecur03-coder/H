
'use client';

import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

let firebaseServices: FirebaseServices | null = null;

/**
 * Initializes Firebase services on the client side if they haven't been already.
 * This function is safe to call multiple times.
 * @returns An object containing the initialized Firebase services (app, auth, firestore).
 */
export function initializeFirebase(): FirebaseServices {
  if (typeof window === 'undefined') {
    // This function is client-only. Throw an error if it's called on the server.
    // This helps catch misconfigurations during development.
    throw new Error("Attempted to call initializeFirebase() from the server. Use initializeFirebaseServer() instead.");
  }
  
  if (firebaseServices) {
    return firebaseServices;
  }

  const apps = getApps();
  const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : apps[0];
  const auth = getAuth(firebaseApp);
  
  // Use initializeFirestore for more control, especially for cache
  const firestore = initializeFirestore(firebaseApp, {
    localCache: memoryLocalCache(),
  });

  firebaseServices = { firebaseApp, auth, firestore };
  return firebaseServices;
}
