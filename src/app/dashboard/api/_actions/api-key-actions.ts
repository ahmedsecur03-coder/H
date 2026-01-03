'use server';

import { initializeFirebaseServer } from "@/firebase/init-server";
import { doc, updateDoc } from "firebase/firestore";

export async function regenerateApiKey(userId: string) {
    if (!userId) {
        return { success: false, error: 'User ID is required.' };
    }

    const { firestore } = initializeFirebaseServer();
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
