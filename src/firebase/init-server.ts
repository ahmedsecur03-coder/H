
import 'server-only';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface FirebaseServerServices {
  firebaseApp: App;
  auth: Auth;
  firestore: Firestore;
}

let services: FirebaseServerServices | null = null;

// Initialize Firebase Admin SDK for server-side operations
function initializeFirebaseServer(): FirebaseServerServices {
  if (services) {
    return services;
  }
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set or is invalid.");
  }
  
  const firebaseConfig = {
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  const apps = getApps();
  const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : apps[0];
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  services = { firebaseApp, auth, firestore };
  return services;
}

export { initializeFirebaseServer };
