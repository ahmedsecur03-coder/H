
import 'server-only';
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

function getServiceAccount(): ServiceAccount | undefined {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountStr) {
    // This warning is crucial for debugging deployments.
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT env var not set. Server-side Firebase features will be disabled.'
    );
    return undefined;
  }
  try {
    // This is the recommended format (e.g., for Vercel, Netlify).
    return JSON.parse(Buffer.from(serviceAccountStr, 'base64').toString('utf-8'));
  } catch (e1) {
    try {
        // This is a fallback for local development or other platforms.
        return JSON.parse(serviceAccountStr);
    } catch(e2) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT from both Base64 and direct JSON. Ensure it is a valid JSON string or a Base64-encoded JSON string.', e2);
        return undefined;
    }
  }
}

let adminApp: App | null = null;
let firestoreInstance: Firestore | null = null;

// This function initializes the admin app ONCE and reuses the instance.
export function initializeFirebaseServer() {
  if (adminApp) {
    return { firebaseApp: adminApp, firestore: firestoreInstance };
  }
  
  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    return { firebaseApp: null, firestore: null };
  }
  
  // Use getApps to check if the app is already initialized.
  if (!getApps().length) {
     try {
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
          projectId: firebaseConfig.projectId,
        });
        firestoreInstance = getFirestore(adminApp);
     } catch(error: any) {
        console.error("Failed to initialize Firebase Admin SDK:", error.message);
        return { firebaseApp: null, firestore: null };
     }
  } else {
    // If apps exist, get the default app.
    adminApp = getApps()[0];
    firestoreInstance = getFirestore(adminApp);
  }

  return { firebaseApp: adminApp, firestore: firestoreInstance };
}
