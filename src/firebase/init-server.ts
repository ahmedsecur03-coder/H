// IMPORTANT: This file should only be imported in server-side code.
// It uses the Firebase Admin SDK and requires environment variables for authentication.

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';
import "server-only";

// This is a placeholder for the service account key.
// In a real production environment, you would use environment variables.
const serviceAccount = {
  "type": process.env.FIREBASE_ADMIN_TYPE,
  "project_id": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  "private_key_id": process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_ADMIN_CLIENT_ID,
  "auth_uri": process.env.FIREBASE_ADMIN_AUTH_URI,
  "token_uri": process.env.FIREBASE_ADMIN_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
  "universe_domain": process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN
}


interface FirebaseServerServices {
  firebaseApp: App;
  auth: Auth;
  firestore: Firestore;
}

/**
 * Initializes the Firebase Admin SDK on the server-side if it hasn't been already.
 * This is a singleton; it's safe to call multiple times.
 * @returns An object containing the initialized Firebase Admin services.
 */
export function initializeFirebaseServer(): Partial<FirebaseServerServices> {
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    console.warn("Firebase Admin SDK credentials are not set. Server-side Firebase features will be disabled.");
    return {};
  }
  
  const apps = getApps();
  if (apps.length > 0) {
    const defaultApp = apps[0];
    return {
      firebaseApp: defaultApp,
      auth: getAuth(defaultApp),
      firestore: getFirestore(defaultApp),
    };
  }

  const firebaseApp = initializeApp({
    credential: credential.cert(serviceAccount as any),
    projectId: serviceAccount.project_id,
  });

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}