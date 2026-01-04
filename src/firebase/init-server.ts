
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
 * This function is now enabled to work in both development and production.
 * @returns An object containing the initialized services, or nulls if credentials are not available.
 */
export function initializeFirebaseServer(): FirebaseServerServices {
  // Check if running on the server.
  if (typeof window !== 'undefined') {
    return { firebaseApp: null, firestore: null, auth: null };
  }
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  // If already initialized, return the existing instances.
  if (getApps().length > 0) {
      const firebaseApp = getApp();
       return { 
        firebaseApp: firebaseApp, 
        firestore: getFirestore(firebaseApp), 
        auth: getAuth(firebaseApp) 
    };
  }

  // If not initialized and service account is available, initialize.
  if (serviceAccount) {
    const firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
     return { 
        firebaseApp: firebaseApp, 
        firestore: getFirestore(firebaseApp), 
        auth: getAuth(firebaseApp) 
    };
  }

  // If no credentials and not initialized, return null.
  return { firebaseApp: null, firestore: null, auth: null };
}
