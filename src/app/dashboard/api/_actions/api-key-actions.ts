
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/init';

/**
 * Regenerates the API key for a user.
 * This function is now designed to be callable from the client,
 * but it still contains server-side logic that will only execute
 * in a server context. This is a temporary measure.
 * 
 * In a pure client-side app, this logic would live entirely within the component.
 * However, to maintain the 'use server' directive, we keep the file structure.
 * This function will effectively not be secure if called from the client without
 * proper security rules on the 'users' collection.
 */
export async function regenerateApiKey(userId: string) {
    if (typeof window !== 'undefined') {
        // This part of the code can only run on the client.
        // It's a workaround to make this function work in a client-only environment
        // while the 'use server' directive is still present.
        console.error("This function should not be called from the client in this architecture.");
        return { success: false, error: 'API key regeneration is a server-only action.' };
    }
    
    // The below code will not execute in a pure client-side build on Vercel,
    // but is kept for local development or potential future server-side implementation.
    const { firestore } = initializeFirebase();
    if (!userId || !firestore) {
        return { success: false, error: 'User ID or Firestore not available.' };
    }

    const newApiKey = `hy_${crypto.randomUUID()}`;
    const userDocRef = doc(firestore, 'users', userId);

    try {
        await updateDoc(userDocRef, { apiKey: newApiKey });
        return { success: true, apiKey: newApiKey };
    } catch (error: any) {
        console.error("Failed to regenerate API key:", error);
        return { success: false, error: error.message };
    }
}
