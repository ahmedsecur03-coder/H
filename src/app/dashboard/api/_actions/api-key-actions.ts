
'use server';

import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/server-auth';

/**
 * Regenerates the API key for a specific user.
 * This is a server action to ensure security.
 * @param userId The ID of the user to regenerate the key for.
 * @returns An object with success status and the new key or an error message.
 */
export async function regenerateApiKey(userId: string): Promise<{ success: boolean; apiKey?: string; error?: string; }> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        return { success: false, error: "فشل الاتصال بقاعدة البيانات." };
    }

    const userDocRef = doc(firestore, 'users', userId);
    const newApiKey = `hy_${crypto.randomUUID().replace(/-/g, '')}`;

    try {
        await updateDoc(userDocRef, { apiKey: newApiKey });
        return { success: true, apiKey: newApiKey };
    } catch (error) {
        console.error("API Key Regeneration Error:", error);
        // In a real app, you might want to check for permission errors specifically
        return { success: false, error: "فشل إنشاء مفتاح جديد. قد تكون هناك مشكلة في الصلاحيات." };
    }
}
