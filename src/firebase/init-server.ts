import { getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// This is a separate initialization for server-side usage (e.g., in API routes or generateMetadata)
// It avoids including client-side auth dependencies in server-only code.

// Use a symbol to ensure a unique key for the global object.
const FIREBASE_SERVER_KEY = Symbol.for('firebase.server.services');

interface FirebaseServerServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
}

// Extend the global object to include our custom property.
declare global {
  var [FIREBASE_SERVER_KEY]: FirebaseServerServices | undefined;
}

export function initializeFirebaseServer(): FirebaseServerServices {
  const existingServices = global[FIREBASE_SERVER_KEY];
  if (existingServices) {
    return existingServices;
  }
  
  const apps = getApps();
  // Ensure we don't re-initialize an app with the same name.
  const firebaseApp = apps.find(app => app.name === firebaseConfig.projectId) || initializeApp(firebaseConfig, firebaseConfig.projectId);
  const firestore = getFirestore(firebaseApp);

  const services: FirebaseServerServices = { firebaseApp, firestore };
  
  // In development, don't cache on global, to allow for hot-reloading.
  if (process.env.NODE_ENV === 'production') {
    global[FIREBASE_SERVER_KEY] = services;
  }
  
  return services;
}
