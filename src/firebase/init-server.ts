// IMPORTANT: This file should only be imported in server-side code.
// It uses the Firebase Admin SDK and requires environment variables for authentication.

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

// Interface for the structured service account key
interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface FirebaseServerServices {
  firebaseApp: App;
  auth: Auth;
  firestore: Firestore;
}

function parseServiceAccount(): ServiceAccount | null {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    console.warn("FIREBASE_SERVICE_ACCOUNT environment variable is not set. Server-side Firebase features will be disabled.");
    return null;
  }
  try {
    return JSON.parse(serviceAccountJson);
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON.", e);
    return null;
  }
}

/**
 * Initializes the Firebase Admin SDK on the server-side if it hasn't been already.
 * This is a singleton; it's safe to call multiple times.
 * It relies on the `FIREBASE_SERVICE_ACCOUNT` environment variable.
 * @returns An object containing the initialized Firebase Admin services.
 */
export function initializeFirebaseServer(): Partial<FirebaseServerServices> {
  const apps = getApps();
  if (apps.length > 0) {
    const defaultApp = apps[0];
    return {
      firebaseApp: defaultApp,
      auth: getAuth(defaultApp),
      firestore: getFirestore(defaultApp),
    };
  }

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    // Return a partial object so the app doesn't crash on destructuring
    return { firebaseApp: undefined, auth: undefined, firestore: undefined };
  }
  
  const firebaseApp = initializeApp({
    credential: credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}
