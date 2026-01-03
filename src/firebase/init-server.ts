

import { getApps, initializeApp, App, cert, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseServerServices {
  firebaseApp: App | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

/**
 * Initializes Firebase Admin services on the server-side.
 * This function is now disabled to ensure a client-only architecture.
 * @returns An object containing null services.
 */
export function initializeFirebaseServer(): FirebaseServerServices {
  // This function is intentionally disabled to adhere to a client-only architecture.
  // Returning null for all services prevents any server-side Firebase logic from running.
  // This helps avoid build errors in environments where server-side credentials are not available.
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
     return { firebaseApp: null, firestore: null, auth: null };
  }
  
  // The following code will only run in a local development environment
  // to prevent crashing local server functionalities that might still use it.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (getApps().length === 0 && serviceAccount) {
    const firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
     return { 
        firebaseApp: firebaseApp, 
        firestore: getFirestore(firebaseApp), 
        auth: getAuth(firebaseApp) 
    };
  } else if (getApps().length > 0) {
      const firebaseApp = getApp();
       return { 
        firebaseApp: firebaseApp, 
        firestore: getFirestore(firebaseApp), 
        auth: getAuth(firebaseApp) 
    };
  }

  return { firebaseApp: null, firestore: null, auth: null };
}
