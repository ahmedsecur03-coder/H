// IMPORTANT: This file should only be imported in server-side code.
// It uses the Firebase Admin SDK and requires environment variables for authentication.

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

// Since we are now using a dedicated JSON file, we can import it directly.
// This requires `resolveJsonModule` to be true in tsconfig.json
import serviceAccount from '../../firebase-service-account.json';


interface FirebaseServerServices {
  firebaseApp: App;
  auth: Auth;
  firestore: Firestore;
}

/**
 * Initializes the Firebase Admin SDK on the server-side if it hasn't been already.
 * This is a singleton; it's safe to call multiple times.
 * It now relies on the `firebase-service-account.json` file.
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

  // Check if the service account has the necessary properties.
  // The type assertion is needed because the JSON import might not be perfectly typed.
  const sa = serviceAccount as { project_id?: string; private_key?: string; client_email?: string };
  if (!sa.project_id || !sa.private_key || !sa.client_email) {
    console.error("The firebase-service-account.json file is missing or incomplete. Server-side Firebase features will be disabled.");
    return { firebaseApp: undefined, auth: undefined, firestore: undefined };
  }
  
  const firebaseApp = initializeApp({
    // We cast the imported JSON to the type expected by `credential.cert`
    credential: credential.cert(serviceAccount as any),
    projectId: serviceAccount.project_id,
  });

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}
