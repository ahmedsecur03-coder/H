
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { getAuthenticatedUser } from '@/firebase/server-auth';


export async function regenerateApiKey(userId: string): Promise<{ success: boolean; apiKey?: string; error?: string; }> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        return { success: false, error: "Database not available." };
    }
    
    // Server-side authentication check using headers
    // This is a more robust way to handle server-action security
    const authResult = await getAuthenticatedUser();
    if (authResult.user?.uid !== userId) {
        return { success: false, error: 'Unauthorized' };
    }

    const newApiKey = `hy_${crypto.randomUUID().replace(/-/g, '')}`;
    const userDocRef = doc(firestore, 'users', userId);

    try {
        await updateDoc(userDocRef, { apiKey: newApiKey });
        return { success: true, apiKey: newApiKey };
    } catch (error: any) {
        console.error("Failed to regenerate API key:", error);
        return { success: false, error: error.message };
    }
}
