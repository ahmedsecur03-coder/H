
import { getApps, initializeApp, App, cert, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

// This is a separate initialization for server-side usage (e.g., in API routes or server actions)
// It uses the Firebase Admin SDK.

interface FirebaseServerServices {
  firebaseApp: App;
  firestore: Firestore;
  auth: Auth;
}

// Ensure the service account key is correctly parsed
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

/**
 * Initializes Firebase Admin services on the server-side.
 * This function is safe to call multiple times.
 * @returns An object containing the initialized Firebase Admin services.
 */
export function initializeFirebaseServer(): FirebaseServerServices {
  const apps = getApps();
  let firebaseApp: App;

  if (apps.length === 0) {
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is invalid.');
    }
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
  } else {
    firebaseApp = getApp();
  }

  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);

  return { firebaseApp, firestore, auth };
}
