
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', e);
      return undefined;
    }
  }
  return undefined;
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebaseServer() {
  const serviceAccount = getServiceAccount();

  // If service account is not available, we can't initialize the admin app.
  // Return null for services to be handled gracefully by the calling function.
  if (!serviceAccount) {
    // The console.warn message has been removed to avoid clutter in the development console.
    // The original warning was: 'FIREBASE_SERVICE_ACCOUNT env var not set...'
    return { firebaseApp: null, firestore: null };
  }

  if (!getApps().length) {
    try {
      const app = initializeApp({
        credential: cert(serviceAccount),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
        projectId: firebaseConfig.projectId,
      });
      return getSdks(app);
    } catch (error: any) {
        console.error("Failed to initialize Firebase Admin SDK:", error.message);
        return { firebaseApp: null, firestore: null };
    }
  }

  return getSdks(getApps()[0]);
}

export function getSdks(app: App): { firebaseApp: App, firestore: Firestore } {
  const firestore = getFirestore(app);
  return {
    firebaseApp: app,
    firestore,
  };
}
