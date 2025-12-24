import 'server-only';

import type { User, Order } from '@/lib/types';
import { Firestore, Transaction, FieldValue } from 'firebase-admin/firestore';
import { getRankForSpend, RANKS, AFFILIATE_LEVELS } from '@/lib/service';

const MULTI_LEVEL_COMMISSIONS = [3, 2, 1, 0.5, 0.25]; // Corresponds to levels 2, 3, 4, 5, 6

/**
 * Server-side version of processOrderInTransaction.
 * This function is designed to be used in server environments (like API routes)
 * and uses the Firebase Admin SDK's Transaction object.
 *
 * @param transaction The Firestore Admin Transaction object.
 * @param firestore The Firestore Admin instance.
 * @param userId The ID of the user placing the order.
 * @param orderData The data for the new order.
 * @returns A promise that resolves with the ID of the newly created order.
 */
export async function serverProcessOrderInTransaction(
    transaction: Transaction,
    firestore: Firestore,
    userId: string,
    orderData: Omit<Order, 'id'>,
): Promise<string> { // Returns the new order ID
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

    // 1. Update user's balance and total spent
    const newBalance = userData.balance - cost;
    const newTotalSpent = (userData.totalSpent || 0) + cost;

    transaction.update(userRef, {
        balance: newBalance,
        totalSpent: newTotalSpent,
    });
    
    // Note: Rank promotion rewards are handled on the client-side/order form for immediate feedback.
    // The rank itself is derived, so no update is needed here unless we denormalize it.
    
    // 2. Create the new order document
    const newOrderRef = firestore.collection(`users/${userId}/orders`).doc();
    transaction.set(newOrderRef, orderData);

    // 3. Handle multi-level affiliate commissions
    let currentReferrerId = userData.referrerId;
    
    // Level 1 Commission (Direct)
    if (currentReferrerId) {
        const directReferrerRef = firestore.collection('users').doc(currentReferrerId);
        const directReferrerDoc = await transaction.get(directReferrerRef);

        if (directReferrerDoc.exists) {
            const referrerData = directReferrerDoc.data() as User;
            const affiliateLevel = referrerData.affiliateLevel || 'برونزي';
            const directCommissionRate = AFFILIATE_LEVELS[affiliateLevel].commission / 100;
            const directCommissionAmount = cost * directCommissionRate;

            if (directCommissionAmount > 0) {
                 transaction.update(directReferrerRef, {
                    affiliateEarnings: FieldValue.increment(directCommissionAmount)
                });
                const newTransactionRef = firestore.collection(`users/${currentReferrerId}/affiliateTransactions`).doc();
                transaction.set(newTransactionRef, {
                    userId: currentReferrerId,
                    referralId: userId,
                    orderId: newOrderRef.id,
                    amount: directCommissionAmount,
                    transactionDate: new Date().toISOString(),
                    level: 1,
                });
            }
             // Set up for next level
            currentReferrerId = referrerData.referrerId;
        } else {
             currentReferrerId = null; // Stop if a referrer in the chain doesn't exist
        }
    }

    // Levels 2-6 Commissions (Indirect/Network)
    for (let i = 0; i < MULTI_LEVEL_COMMISSIONS.length && currentReferrerId; i++) {
        const commissionRate = MULTI_LEVEL_COMMISSIONS[i] / 100;
        const commissionAmount = cost * commissionRate;
        const level = i + 2;

        if (commissionAmount > 0) {
            const referrerRef = firestore.collection('users').doc(currentReferrerId);
            const referrerDoc = await transaction.get(referrerRef);

            if (referrerDoc.exists()) {
                const referrerData = referrerDoc.data() as User;
                
                transaction.update(referrerRef, {
                    affiliateEarnings: FieldValue.increment(commissionAmount)
                });

                const newTransactionRef = firestore.collection(`users/${currentReferrerId}/affiliateTransactions`).doc();
                transaction.set(newTransactionRef, {
                    userId: currentReferrerId,
                    referralId: userId,
                    orderId: newOrderRef.id,
                    amount: commissionAmount,
                    transactionDate: new Date().toISOString(),
                    level: level,
                });

                // Move to the next referrer up the chain
                currentReferrerId = referrerData.referrerId; 
            } else {
                break; // Stop if a referrer in the chain doesn't exist
            }
        }
    }
    
    return newOrderRef.id;
}
