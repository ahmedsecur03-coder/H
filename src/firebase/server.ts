
import 'server-only';
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

function getServiceAccount(): ServiceAccount | undefined {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountStr) {
    return undefined;
  }
  try {
    // This is the format for Vercel, Netlify, and other platforms
    return JSON.parse(Buffer.from(serviceAccountStr, 'base64').toString('utf-8'));
  } catch (e1) {
    try {
        // This is the format for local development (and some other platforms)
        return JSON.parse(serviceAccountStr);
    } catch(e2) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT from both Base64 and direct JSON:', e2);
        return undefined;
    }
  }
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebaseServer() {
  const serviceAccount = getServiceAccount();

  // If service account is not available, we can't initialize the admin app.
  // Return null for services to be handled gracefully by the calling function.
  if (!serviceAccount) {
    // This warning is crucial for debugging deployments on platforms like Vercel
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT env var not set or invalid. Server-side Firebase features will be disabled.'
    );
    return { firebaseApp: null, firestore: null };
  }
  
  if (getApps().length > 0) {
    return getSdks(getApps()[0]);
  }

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

export function getSdks(app: App): { firebaseApp: App, firestore: Firestore } {
  const firestore = getFirestore(app);
  return {
    firebaseApp: app,
    firestore,
  };
}
