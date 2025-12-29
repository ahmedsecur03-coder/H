'use server';

import { initializeFirebaseServer } from "@/firebase/server";
import type { Campaign, User, Notification } from "@/lib/types";
import { FieldValue } from "firebase-admin/firestore";


/**
 * A server action to automatically activate a campaign and deduct the balance.
 * This simulates a backend process after a short "review" period.
 * @param userId The ID of the user who owns the campaign.
 * @param campaignId The ID of the campaign to activate.
 */
export async function activateCampaignAndDeductBalance(userId: string, campaignId: string) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        throw new Error("Server error: Could not connect to database.");
    }
    
    const userDocRef = firestore.doc(`users/${userId}`);
    const campaignDocRef = firestore.doc(`users/${userId}/campaigns/${campaignId}`);

    try {
        await firestore.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const campaignDoc = await transaction.get(campaignDocRef);

            if (!userDoc.exists || !campaignDoc.exists) {
                throw new Error("User or Campaign not found.");
            }
            
            const userData = userDoc.data() as User;
            const campaignData = campaignDoc.data() as Campaign;

            if (campaignData.status !== 'بانتظار المراجعة') {
                // Campaign was already processed or cancelled.
                return;
            }

            if ((userData.adBalance ?? 0) < campaignData.budget) {
                // Not enough balance, notify the user.
                const notification: Notification = {
                    id: `campaign-fail-${campaignId}`,
                    message: `فشلت مراجعة حملتك "${campaignData.name}" بسبب عدم كفاية رصيد الإعلانات.`,
                    type: 'error',
                    read: false,
                    createdAt: new Date().toISOString(),
                    href: '/dashboard/add-funds'
                };
                transaction.update(userDocRef, {
                    notifications: FieldValue.arrayUnion(notification)
                });
                // We could also change the campaign status to 'failed' or 'rejected' here.
                // For now, we'll leave it pending for the user to see.
                return;
            }

            // 1. Deduct budget from user's adBalance
            const newAdBalance = (userData.adBalance ?? 0) - campaignData.budget;
            
            // 2. Prepare campaign activation updates
            const campaignUpdates = { 
                status: 'نشط' as const,
                startDate: new Date().toISOString(),
            };
            
             // 3. Prepare user notification
            const notification: Notification = {
                id: `campaign-act-${campaignId}`,
                message: `تم تفعيل حملتك الإعلانية "${campaignData.name}" بنجاح وبدأت في العمل.`,
                type: 'success',
                read: false,
                createdAt: new Date().toISOString(),
                href: '/dashboard/campaigns'
            };

            // 4. Apply all updates in the transaction
            transaction.update(userDocRef, { 
                adBalance: newAdBalance,
                notifications: FieldValue.arrayUnion(notification)
            });
            transaction.update(campaignDocRef, campaignUpdates);
        });

    } catch (error) {
        console.error(`Failed to activate campaign ${campaignId} for user ${userId}:`, error);
        // We could add another notification here to inform the user of a system error.
        throw error; // Re-throw to let the caller know it failed.
    }
}
