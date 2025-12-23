
'use server';

import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { revalidatePath } from 'next/cache';

export async function regenerateApiKey(): Promise<void> {
  const { user } = await getAuthenticatedUser();
  const { firestore } = initializeFirebaseServer();

  if (!user || !firestore) {
    throw new Error('User is not authenticated or Firebase could not be initialized.');
  }

  const newApiKey = `hy_${crypto.randomUUID()}`;

  try {
    const userDocRef = firestore.collection('users').doc(user.uid);
    await userDocRef.update({
      apiKey: newApiKey,
    });

    // Revalidate the path to ensure the new API key is displayed
    revalidatePath('/dashboard/api');
  } catch (error: any) {
    console.error("Error regenerating API key:", error);
    throw new Error('Failed to regenerate API key.');
  }
}
