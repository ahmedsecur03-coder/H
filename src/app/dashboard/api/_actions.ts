'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { initializeFirebase } from '@/firebase/init'; 

export async function regenerateApiKey(userId: string): Promise<{ success: boolean, error?: string }> {
    const { firestore } = initializeFirebase();
    if (!firestore) {
        return { success: false, error: 'Firestore is not initialized.' };
    }

    const userDocRef = doc(firestore, 'users', userId);
    const newApiKey = `hy_${crypto.randomUUID().replace(/-/g, '')}`;
    const updateData = { apiKey: newApiKey };

    try {
        await updateDoc(userDocRef, updateData);
        revalidatePath('/dashboard/api'); // Revalidate the API page to show the new key
        return { success: true };
    } catch (error: any) {
        console.error("Error regenerating API key:", error);
        // A generic error is returned to avoid leaking implementation details.
        // The detailed error is logged on the server.
        return { success: false, error: 'Permission denied or server error.' };
    }
}
