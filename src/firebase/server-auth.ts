import 'server-only';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { credential } from 'firebase-admin';

// This file is for server-side Firebase initialization and authentication.

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
  
  const firebaseConfig = {
    // You must use a service account for server-side (Admin) SDK
    credential: credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };

  const apps = getApps();
  const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : apps[0];
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  services = { firebaseApp, auth, firestore };
  return services;
}

/**
 * Gets the currently authenticated user on the server side.
 * @returns A promise that resolves with the user object or null if not authenticated.
 */
export async function getAuthenticatedUser(): Promise<{ user: { uid: string, email?: string, name?: string, picture?: string } | null }> {
  const { auth } = initializeFirebaseServer();
  const sessionCookie = cookies().get("session")?.value;

  if (!sessionCookie) {
    return { user: null };
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      }
    };
  } catch (error) {
    // Session cookie is invalid or expired.
    return { user: null };
  }
}

// Export the initialization function for use in other server-side modules.
export { initializeFirebaseServer };
