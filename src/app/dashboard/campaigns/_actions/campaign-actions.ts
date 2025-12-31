'use server';

import { initializeFirebaseServer } from '@/firebase/server';
import type { Campaign, User, Notification } from '@/lib/types';
import { FieldValue, Firestore } from 'firebase-admin/firestore';

async function getAdminFirestore(): Promise<Firestore> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        throw new Error("Firestore Admin SDK is not initialized.");
    }
    return firestore;
}

/**
 * A server action to automatically activate a campaign and deduct the balance.
 * This simulates a backend process after a short "review" period.
 * @param userId The ID of the user who owns the campaign.
 * @param campaignId The ID of the campaign to activate.
 */
export async function activateCampaignAndDeductBalance(userId: string, campaignId: string) {
    const firestore = await getAdminFirestore();
    const userDocRef = firestore.collection('users').doc(userId);
    const campaignDocRef = firestore.collection(`users/${userId}/campaigns`).doc(campaignId);

    try {
        await firestore.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const campaignDoc = await transaction.get(campaignDocRef);

            if (!userDoc.exists() || !campaignDoc.exists()) {
                throw new Error("User or Campaign not found.");
            }
            
            const userData = userDoc.data() as User;
            const campaignData = campaignDoc.data() as Campaign;

            if (campaignData.status !== 'بانتظار المراجعة') {
                return; // Already processed
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
                transaction.update(userDocRef, {
                    notifications: FieldValue.arrayUnion(notification),
                    status: 'متوقف', // Also stop the campaign
                });
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
                notifications: FieldValue.arrayUnion(notification)
            });
            transaction.update(campaignDocRef, campaignUpdates);
        });
    } catch (error) {
        console.error(`Failed to activate campaign ${campaignId} for user ${userId}:`, error);
        // In a real app, you'd have more robust error logging here.
    }
}

/**
 * Server Action to get simulated live performance data for a campaign.
 * @param campaign The campaign object.
 * @returns A partial campaign object with updated performance metrics.
 */
export async function getLiveCampaignPerformance(campaign: Campaign): Promise<Partial<Campaign>> {
    if (campaign.status !== 'نشط' || !campaign.startDate) {
        return {};
    }

    const { startDate, durationDays, budget } = campaign;
    const now = Date.now();
    const startTime = new Date(startDate).getTime();
    const totalDurationMillis = durationDays * 24 * 60 * 60 * 1000;
    const endTime = startTime + totalDurationMillis;

    const elapsedMillis = Math.max(0, now - startTime);
    const progress = Math.min(elapsedMillis / totalDurationMillis, 1);
    
    if (progress >= 1) {
        // If the campaign is over, calculate final state deterministically.
        const finalSpend = budget; 
        const finalImpressions = (campaign.impressions || 0) + Math.floor(Math.random() * (budget * 20));
        const finalClicks = (campaign.clicks || 0) + Math.floor(Math.random() * (budget * 2));
        const finalCtr = finalImpressions > 0 ? (finalClicks / finalImpressions) * 100 : 0;
        const finalCpc = finalClicks > 0 ? finalSpend / finalClicks : 0;

        return { 
            status: 'مكتمل', 
            spend: finalSpend,
            impressions: finalImpressions,
            clicks: finalClicks,
            ctr: finalCtr,
            cpc: finalCpc,
            results: Math.floor(finalClicks * 0.2),
        };
    }

    const simulatedSpend = Math.min(budget * progress * (1 + (Math.random() - 0.5) * 0.1), budget);

    if (simulatedSpend <= (campaign.spend || 0)) {
        return {}; // No new spend to report
    }

    // Simulate new performance based on the increment in spend
    const spendIncrement = simulatedSpend - (campaign.spend || 0);
    const impressions = (campaign.impressions || 0) + Math.floor(spendIncrement * (Math.random() * 150 + 50));
    const clicks = (campaign.clicks || 0) + Math.floor((impressions - (campaign.impressions || 0)) * (Math.random() * 0.05 + 0.01));
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? simulatedSpend / clicks : 0;
    const results = (campaign.results || 0) + Math.floor((clicks - (campaign.clicks || 0)) * 0.2);

    return {
        spend: simulatedSpend,
        impressions,
        clicks,
        ctr,
        cpc,
        results,
    };
};


/**
 * Server Action to stop a campaign and refund the remaining budget.
 * @param userId The ID of the user.
 * @param campaignId The ID of the campaign to stop.
 */
export async function stopCampaignAndRefund(userId: string, campaignId: string): Promise<void> {
    const firestore = await getAdminFirestore();
    const userDocRef = firestore.collection('users').doc(userId);
    const campaignDocRef = firestore.collection(`users/${userId}/campaigns`).doc(campaignId);

    await firestore.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

        const campaignDoc = await transaction.get(campaignDocRef);
        if (!campaignDoc.exists()) throw new Error("الحملة غير موجودة.");
        
        const currentCampaignData = campaignDoc.data() as Campaign;
        if (currentCampaignData.status !== 'نشط') throw new Error("لا يمكن إيقاف إلا الحملات النشطة.");

        // Get one final performance update before stopping
        const finalPerformance = await getLiveCampaignPerformance(currentCampaignData);
        const finalSpend = finalPerformance.spend ?? currentCampaignData.spend;
        const remainingBudget = currentCampaignData.budget - (finalSpend || 0);

        if (remainingBudget > 0) {
            transaction.update(userDocRef, { adBalance: FieldValue.increment(remainingBudget) });
        }

        transaction.update(campaignDocRef, { 
            ...finalPerformance,
            status: 'متوقف',
            spend: finalSpend,
        });
    });
}
