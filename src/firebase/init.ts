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
  // This function is intended for the client, but throwing an error can cause
  // issues with Next.js build/server environments that might try to import it.
  // Instead, we safely return null if called on the server.
  if (typeof window === 'undefined') {
    // Return a structure that won't immediately crash if destructured,
    // although hooks like useFirestore will throw their own errors if used on the server.
    return { firebaseApp: null, auth: null, firestore: null } as any;
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
