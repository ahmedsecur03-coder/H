
'use server';
import { initializeFirebaseServer } from '@/firebase/init-server';
import { doc, runTransaction, increment } from 'firebase/firestore';

export async function activateCampaignAndDeductBalance(userId: string, campaignId: string) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        console.error("Firestore is not initialized on the server.");
        return { success: false, error: "Server error" };
    }

    const userDocRef = doc(firestore, 'users', userId);
    const campaignDocRef = doc(firestore, `users/${userId}/campaigns`, campaignId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const campaignDoc = await transaction.get(campaignDocRef);

            if (!userDoc.exists() || !campaignDoc.exists()) {
                throw new Error("User or Campaign not found.");
            }

            const userData = userDoc.data();
            const campaignData = campaignDoc.data();

            if ((userData.adBalance || 0) < campaignData.budget) {
                throw new Error("Insufficient ad balance.");
            }

            // Deduct budget from adBalance
            transaction.update(userDocRef, { adBalance: increment(-campaignData.budget) });
            
            // Activate campaign
            transaction.update(campaignDocRef, { 
                status: 'نشط',
                startDate: new Date().toISOString() 
            });
        });
        return { success: true };
    } catch (error: any) {
        console.error("Failed to activate campaign:", error);
        return { success: false, error: error.message };
    }
}
