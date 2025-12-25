
import 'server-only';

import type { User, Order } from '@/lib/types';
import { Firestore, Transaction, FieldValue } from 'firebase-admin/firestore';
import { getRankForSpend, RANKS, AFFILIATE_LEVELS } from '@/lib/service';

/**
 * Server-side version of processOrderInTransaction.
 * This function is the single source of truth for all order processing logic.
 * It is designed to be used in server environments (like API routes)
 * and uses the Firebase Admin SDK's Transaction object.
 *
 * NOTE: Affiliate commission logic has been moved to the deposit approval process
 * and is no longer handled here.
 *
 * @param transaction The Firestore Admin Transaction object.
 * @param firestore The Firestore Admin instance.
 * @param userId The ID of the user placing the order.
 * @param orderData The data for the new order.
 * @returns A promise that resolves with the ID of the newly created order and any promotion.
 */
export async function serverProcessOrderInTransaction(
    transaction: Transaction,
    firestore: Firestore,
    userId: string,
    orderData: Omit<Order, 'id'>,
): Promise<{ orderId: string, promotion: { title: string, description: string } | null }> {
    const userRef = firestore.collection("users").doc(userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
        throw new Error("User performing the transaction does not exist.");
    }

    const userData = userDoc.data() as User;
    const cost = orderData.charge;

    if (userData.balance < cost) {
        throw new Error("Not enough funds on balance.");
    }

    // 1. Update user's balance, total spent, and check for rank promotion
    const newBalance = userData.balance - cost;
    const newTotalSpent = (userData.totalSpent || 0) + cost;
    const oldRank = getRankForSpend(userData.totalSpent || 0);
    const newRank = getRankForSpend(newTotalSpent);

    const userUpdates: { [key: string]: any } = {
        balance: newBalance,
        totalSpent: newTotalSpent,
    };

    let promotion: { title: string, description: string } | null = null;
    if (newRank.name !== oldRank.name) {
        userUpdates.rank = newRank.name;
        if (newRank.reward > 0) {
            userUpdates.adBalance = FieldValue.increment(newRank.reward);
            promotion = {
                title: `🎉 ترقية! أهلاً بك في رتبة ${newRank.name}`,
                description: `لقد حصلت على مكافأة ${newRank.reward}$ في رصيد إعلاناتك!`,
            };
        }
    }

    transaction.update(userRef, userUpdates);
    
    // 2. Create the new order document
    const newOrderRef = firestore.collection(`users/${userId}/orders`).doc();
    transaction.set(newOrderRef, orderData);

    // 3. Aggregate daily stats
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyStatRef = firestore.collection('dailyStats').doc(today);
    transaction.set(dailyStatRef, {
        totalRevenue: FieldValue.increment(cost),
        totalOrders: FieldValue.increment(1)
    }, { merge: true });

    return { orderId: newOrderRef.id, promotion };
}
