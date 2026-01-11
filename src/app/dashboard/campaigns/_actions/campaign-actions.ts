
'use server';

import { initializeFirebaseServer } from "@/firebase/init-server";
import type { Campaign, User, Notification } from '@/lib/types';
import { doc, runTransaction, arrayUnion, increment } from 'firebase/firestore';


/**
 * A server action to automatically activate a campaign and deduct the balance.
 * This simulates a backend process after a short "review" period.
 * @param userId The ID of the user who owns the campaign.
 * @param campaignId The ID of the campaign to activate.
 */
export async function activateCampaignAndDeductBalance(userId: string, campaignId: string) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        console.error("Firestore not available in Server Action.");
        return { error: "Could not connect to the database." };
    }

    try {
        const userDocRef = doc(firestore, 'users', userId);
        const campaignDocRef = doc(firestore, `users/${userId}/campaigns`, campaignId);

        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const campaignDoc = await transaction.get(campaignDocRef);

            if (!userDoc.exists() || !campaignDoc.exists()) {
                throw new Error(`User ${userId} or Campaign ${campaignId} not found for activation.`);
            }
            
            const userData = userDoc.data() as User;
            const campaignData = campaignDoc.data() as Campaign;

            if (campaignData.status !== 'بانتظار المراجعة') {
                return; // Already processed or not in the right state
            }

            if ((userData.adBalance ?? 0) < campaignData.budget) {
                const notification: Notification = {
                    id: `campaign-fail-${campaignId}`,
                    message: `فشلت مراجعة حملتك "${campaignData.name}" بسبب عدم كفاية رصيد الإعلانات.`,
                    type: 'error',
                    read: false,
                    createdAt: new Date().toISOString(),
                    href: '/dashboard/add-funds'
                };
                transaction.update(campaignDocRef, { status: 'متوقف' });
                // We do not update the user's notifications in this transaction to avoid read-after-write conflicts if another process modifies it.
                // Notifications will be handled by a separate, more robust system or can be added in a different transaction context if needed.
                return;
            }

            const newAdBalance = (userData.adBalance ?? 0) - campaignData.budget;
            
            const campaignUpdates = { 
                status: 'نشط' as const,
                startDate: new Date().toISOString(),
            };
            
            const notification: Notification = {
                id: `campaign-act-${campaignId}`,
                message: `تم تفعيل حملتك الإعلانية "${campaignData.name}" بنجاح وبدأت في العمل.`,
                type: 'success',
                read: false,
                createdAt: new Date().toISOString(),
                href: '/dashboard/campaigns'
            };

            transaction.update(userDocRef, { 
                adBalance: newAdBalance,
                notifications: arrayUnion(notification)
            });
            transaction.update(campaignDocRef, campaignUpdates);
        });
        return { success: true };
    } catch (error: any) {
        console.error(`Failed to activate campaign ${campaignId} for user ${userId}:`, error);
        return { error: error.message };
    }
}
