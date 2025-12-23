'use server';

import type { User, BlogPost } from '@/lib/types';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/server';

/**
 * Gives the user a $1 ad credit.
 * This is a server-side function.
 * @param userId The ID of the user claiming the reward.
 */
export async function claimDailyReward(userId: string): Promise<void> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        throw new Error("خوادم المكافآت غير متاحة حاليًا، يرجى المحاولة مرة أخرى لاحقًا.");
    }

    const userRef = doc(firestore, 'users', userId);
    
    // We must use a transaction to safely check the date and update the balance.
    await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
            throw new Error("المستخدم غير موجود.");
        }

        const userData = userDoc.data() as User;
        const lastClaimed = userData.lastRewardClaimedAt ? new Date(userData.lastRewardClaimedAt).getTime() : 0;
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (Date.now() - lastClaimed < twentyFourHours) {
            throw new Error("لقد حصلت على مكافأتك بالفعل اليوم. عد غدًا!");
        }

        // Add $1 to the user's adBalance and update last claimed date
        const newAdBalance = (userData.adBalance || 0) + 1;
        transaction.update(userRef, { 
            adBalance: newAdBalance,
            lastRewardClaimedAt: new Date().toISOString() 
        });
    });
}
