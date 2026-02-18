
import type { User, Order, Notification } from '@/lib/types';
import { collection, doc, Firestore, Transaction, increment, arrayUnion } from 'firebase/firestore';
import { Crown, Rocket, Star, Users } from 'lucide-react';


export const RANKS: { name: User['rank']; spend: number; discount: number, reward: number, icon: React.ElementType }[] = [
  { name: 'مستكشف نجمي', spend: 0, discount: 0, reward: 0, icon: Star },
  { name: 'قائد صاروخي', spend: 500, discount: 2, reward: 0, icon: Rocket },
  { name: 'سيد المجرة', spend: 2500, discount: 5, reward: 0, icon: Users },
  { name: 'سيد كوني', spend: 10000, discount: 10, reward: 0, icon: Crown },
];

export const AFFILIATE_LEVELS: { [key in Exclude<User['affiliateLevel'], undefined>]: { commission: number, nextLevel: User['affiliateLevel'] | null, requirement: number } } = {
    'برونزي': { commission: 5, nextLevel: 'فضي', requirement: 10 },
    'فضي': { commission: 7, nextLevel: 'ذهبي', requirement: 50 },
    'ذهبي': { commission: 10, nextLevel: 'ماسي', requirement: 200 },
    'ماسي': { commission: 15, nextLevel: null, requirement: Infinity },
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
 */
export async function processOrderInTransaction(
    transaction: Transaction,
    firestore: Firestore,
    userId: string,
    orderData: Omit<Order, 'id'>,
): Promise<{ orderId: string, promotion: { title: string; description: string } | null }> {
    const userRef = doc(firestore, "users", userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
        throw new Error("User performing the transaction does not exist.");
    }

    const userData = userDoc.data() as User;
    
    const rank = getRankForSpend(userData.totalSpent || 0);
    const discount = rank.discount / 100;
    const finalCost = orderData.charge * (1 - discount);

    if (userData.balance < finalCost) {
        throw new Error("رصيدك غير كافٍ لإتمام هذا الطلب.");
    }

    orderData.charge = finalCost;
    
    const newBalance = userData.balance - finalCost;
    const newTotalSpent = userData.totalSpent + finalCost;
    const oldRank = getRankForSpend(userData.totalSpent || 0);
    const newRank = getRankForSpend(newTotalSpent);

    const userUpdates: any = {
        balance: newBalance,
        totalSpent: newTotalSpent,
    };
    
    let promotion: { title: string; description: string } | null = null;
    
    if (newRank.name !== oldRank.name) {
        userUpdates.rank = newRank.name;
        promotion = {
            title: `🎉 ترقية! أهلاً بك في رتبة ${newRank.name}`,
            description: `لقد تمت ترقيتك وحصلت على خصم إضافي ${newRank.discount}% على جميع الخدمات!`,
        };
        const rankUpNotification: Notification = {
            id: `rank-${newRank.name}-${Date.now()}`,
            message: `تهانينا! لقد تمت ترقيتك إلى رتبة ${newRank.name} وحصلت على خصم ${newRank.discount}% دائم.`,
            type: 'success',
            read: false,
            createdAt: new Date().toISOString(),
            href: '/dashboard/profile'
        };
        userUpdates.notifications = arrayUnion(rankUpNotification);
    }
    
    transaction.update(userRef, userUpdates);

    const newOrderRef = doc(collection(firestore, `users/${userId}/orders`));
    transaction.set(newOrderRef, orderData);

    const today = new Date().toISOString().split('T')[0];
    const dailyStatRef = doc(firestore, 'dailyStats', today);
    transaction.set(dailyStatRef, {
        totalRevenue: increment(finalCost),
        totalOrders: increment(1)
    }, { merge: true });

    return { orderId: newOrderRef.id, promotion };
}
