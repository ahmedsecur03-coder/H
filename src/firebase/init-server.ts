
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
 * This function is robust for both development (using client config as fallback)
 * and production (using service account key).
 * @returns An object containing the initialized services, or nulls if initialization fails.
 */
export function initializeFirebaseServer(): FirebaseServerServices {
  if (typeof window !== 'undefined') {
    // This is a server-only function.
    return { firebaseApp: null, firestore: null, auth: null };
  }

  // If already initialized, return the existing app instance.
  if (getApps().length > 0) {
    const app = getApp();
    return {
      firebaseApp: app,
      firestore: getFirestore(app),
      auth: getAuth(app),
    };
  }
  
  // Try to use the service account key if available (for production).
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (serviceAccount) {
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
    return {
      firebaseApp: app,
      firestore: getFirestore(app),
      auth: getAuth(app),
    };
  }

  // Fallback for development environment where service account might not be set.
  // This uses the public client-side config, which works for server-side
  // rendering in development but has limitations (e.g., cannot mint tokens).
  console.warn("Firebase Admin SDK is being initialized with client-side config. This is intended for development ONLY.");
  const app = initializeApp(firebaseConfig);
  return {
    firebaseApp: app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}
