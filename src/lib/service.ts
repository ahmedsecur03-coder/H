import type { User, Order } from '@/lib/types';
import { collection, doc, Firestore, Transaction, DocumentSnapshot } from 'firebase/firestore';


export const RANKS: { name: User['rank']; spend: number; discount: number, reward: number }[] = [
  { name: 'مستكشف نجمي', spend: 0, discount: 0, reward: 0 },
  { name: 'قائد صاروخي', spend: 500, discount: 2, reward: 5 },
  { name: 'سيد المجرة', spend: 2500, discount: 5, reward: 20 },
  { name: 'سيد كوني', spend: 10000, discount: 10, reward: 50 },
];

export const AFFILIATE_LEVELS = {
    'برونزي': { commission: 10 },
    'فضي': { commission: 12 },
    'ذهبي': { commission: 15 },
    'ماسي': { commission: 20 },
};


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


/**
 * Processes a new order within a Firestore transaction.
 * This function encapsulates the logic for:
 * - Updating user's balance and total spent.
 * - Checking for rank promotion and applying rewards.
 * - Calculating and applying affiliate commissions.
 * - Creating the order document.
 * - Creating the affiliate transaction document.
 * 
 * @param transaction The Firestore transaction object.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user placing the order.
 * @param orderData The data for the new order.
 * @param referrerDocSnapshot An optional snapshot of the referrer's user document.
 * @returns A promise that resolves with an object containing an optional promotion message.
 */
export async function processOrderInTransaction(
    transaction: Transaction,
    firestore: Firestore,
    userId: string,
    orderData: Omit<Order, 'id'>,
    referrerDocSnapshot: DocumentSnapshot<User> | null
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

    // 1. Update user's balance and total spent
    const newBalance = userData.balance - cost;
    const newTotalSpent = userData.totalSpent + cost;
    const oldRank = getRankForSpend(userData.totalSpent);
    const newRank = getRankForSpend(newTotalSpent);

    const userUpdates: Partial<User> = {
        balance: newBalance,
        totalSpent: newTotalSpent,
    };
    
    let promotion: { title: string; description: string } | null = null;
    // 2. Check for rank promotion
    if (newRank.name !== oldRank.name) {
        userUpdates.rank = newRank.name;
        if (newRank.reward > 0) {
            userUpdates.adBalance = (userData.adBalance || 0) + newRank.reward;
            promotion = {
                title: `🎉 ترقية! أهلاً بك في رتبة ${newRank.name}`,
                description: `لقد حصلت على مكافأة ${newRank.reward}$ في رصيد إعلاناتك!`,
            };
        }
    }
    
    transaction.update(userRef, userUpdates);

    // 3. Create the new order document
    const newOrderRef = doc(collection(firestore, `users/${userId}/orders`));
    transaction.set(newOrderRef, orderData);

    // 4. Handle affiliate commission
    if (referrerDocSnapshot?.exists()) {
        const referrerData = referrerDocSnapshot.data() as User;
        const affiliateLevel = referrerData.affiliateLevel || 'برونزي';
        const commissionRate = (AFFILIATE_LEVELS[affiliateLevel as keyof typeof AFFILIATE_LEVELS]?.commission || 10) / 100;
        const commissionAmount = cost * commissionRate;

        // Update referrer's affiliate earnings
        transaction.update(referrerDocSnapshot.ref, {
            affiliateEarnings: (referrerData.affiliateEarnings || 0) + commissionAmount
        });

        // Create an affiliate transaction record for the referrer
        const newTransactionRef = doc(collection(firestore, `users/${referrerDocSnapshot.id}/affiliateTransactions`));
        transaction.set(newTransactionRef, {
            userId: referrerDocSnapshot.id,
            referralId: userId,
            orderId: newOrderRef.id,
            amount: commissionAmount,
            transactionDate: new Date().toISOString(),
            level: 1, // Assuming direct referral for now
        });
    }

    return { promotion };
}
