
import 'server-only';
import { initializeFirebaseServer } from '@/firebase/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import type { UserRecord } from 'firebase-admin/auth';

// Helper function to get the auth instance from the server app
function getFirebaseAuth() {
  const { firebaseApp } = initializeFirebaseServer();
  if (!firebaseApp) {
    return null;
  }
  return getAuth(firebaseApp);
}

// Gets the current authenticated user's session from the cookie
export async function getAuthenticatedUser(): Promise<{ user: UserRecord | null }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null };
  }

  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    return { user: null };
  }

  try {
    const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
    const user = await auth.getUser(decodedIdToken.uid);
    return { user };
  } catch (error) {
    // Session cookie is invalid, expired, etc.
    return { user: null };
  }
}
