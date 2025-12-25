

import type { User, Order, BlogPost, Notification } from '@/lib/types';
import { collection, doc, Firestore, Transaction, DocumentSnapshot, addDoc, runTransaction, getDoc, arrayUnion, increment } from 'firebase/firestore';


export const RANKS: { name: User['rank']; spend: number; discount: number, reward: number }[] = [
  { name: 'مستكشف نجمي', spend: 0, discount: 0, reward: 0 },
  { name: 'قائد صاروخي', spend: 500, discount: 2, reward: 5 },
  { name: 'سيد المجرة', spend: 2500, discount: 5, reward: 20 },
  { name: 'سيد كوني', spend: 10000, discount: 10, reward: 50 },
];

export const AFFILIATE_LEVELS: { [key in Exclude<User['affiliateLevel'], undefined>]: { commission: number, nextLevel: User['affiliateLevel'] | null, requirement: number } } = {
    'برونزي': { commission: 5, nextLevel: 'فضي', requirement: 10 },
    'فضي': { commission: 7, nextLevel: 'ذهبي', requirement: 50 },
    'ذهبي': { commission: 10, nextLevel: 'ماسي', requirement: 200 },
    'ماسي': { commission: 15, nextLevel: null, requirement: Infinity },
};


const MULTI_LEVEL_COMMISSIONS = [3, 2, 1, 0.5, 0.25]; // Level 2 gets 3%, Level 3 gets 2%, etc. up to 6 levels total.


export function getRankForSpend(spend: number) {
  let currentRank = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (spend >= RANKS[i].spend) {
      currentRank = RANKS[i];
      break;
    }
  }
  return currentRank;
}

const PROFIT_MARGIN = 1.50; // 50% profit margin

/**
 * Processes a new order within a Firestore transaction.
 * This function encapsulates the logic for:
 * - Updating user's balance and total spent.
 * - Checking for rank promotion and applying rewards.
 * - Creating the order document.
 * 
 * NOTE: Affiliate commissions have been moved to the deposit approval logic.
 * This function now only handles order-related finances.
 * 
 * @param transaction The Firestore transaction object.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user placing the order.
 * @param orderData The data for the new order.
 * @returns A promise that resolves with an object containing an optional promotion message.
 */
export async function processOrderInTransaction(
    transaction: Transaction,
    firestore: Firestore,
    userId: string,
    orderData: Omit<Order, 'id'>,
) {
    const userRef = doc(firestore, "users", userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
        throw new Error("User performing the transaction does not exist.");
    }

    const userData = userDoc.data() as User;
    const cost = orderData.charge;
    
    // Pre-check for sufficient balance
    if (userData.balance < cost) {
        throw new Error("رصيدك غير كافٍ لإتمام هذا الطلب.");
    }

    const newBalance = userData.balance - cost;
    const newTotalSpent = userData.totalSpent + cost;
    const oldRank = getRankForSpend(userData.totalSpent);
    const newRank = getRankForSpend(newTotalSpent);

    const userUpdates: any = {
        balance: newBalance,
        totalSpent: newTotalSpent,
    };
    
    let promotion: { title: string; description: string } | null = null;
    
    if (newRank.name !== oldRank.name) {
        userUpdates.rank = newRank.name;
        if (newRank.reward > 0) {
            userUpdates.adBalance = (userData.adBalance || 0) + newRank.reward;
            promotion = {
                title: `🎉 ترقية! أهلاً بك في رتبة ${newRank.name}`,
                description: `لقد حصلت على مكافأة ${newRank.reward}$ في رصيد إعلاناتك!`,
            };
            // Add a notification for the rank promotion
            const rankUpNotification: Notification = {
                id: `rank-${newRank.name}-${Date.now()}`,
                message: `تهانينا! لقد تمت ترقيتك إلى رتبة ${newRank.name} وحصلت على ${newRank.reward}$ مكافأة.`,
                type: 'success',
                read: false,
                createdAt: new Date().toISOString(),
                href: '/dashboard/profile'
            };
            userUpdates.notifications = arrayUnion(rankUpNotification);
        }
    }
    
    transaction.update(userRef, userUpdates);

    // Create the new order document
    const newOrderRef = doc(collection(firestore, `users/${userId}/orders`));
    transaction.set(newOrderRef, orderData);

    // Aggregate daily stats
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyStatRef = doc(firestore, 'dailyStats', today);
    transaction.set(dailyStatRef, {
        totalRevenue: increment(cost),
        totalOrders: increment(1)
    }, { merge: true });

    return { promotion };
}
