'use server';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import type { User as FirebaseUser } from 'firebase-admin/auth';
import { User } from '@/lib/types'; // Your app's user type

interface AuthResult {
  user: (FirebaseUser & User) | null;
  idToken: string | null;
}

/**
 * Gets the currently authenticated user on the server.
 * Relies on the ID token being passed in the Authorization header.
 * @returns {Promise<AuthResult>}
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  const { auth } = initializeFirebaseServer(); // Ensure this is the admin app
  const authorization = headers().get('Authorization');

  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await auth.getUser(decodedToken.uid);
      
      // Here you would typically fetch the user's profile from Firestore
      // to merge with the auth data. For now, we'll just cast it.
      const appUser = user as (FirebaseUser & User);

      return { user: appUser, idToken };
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return { user: null, idToken: null };
    }
  }

  return { user: null, idToken: null };
}
