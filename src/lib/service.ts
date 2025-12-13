
import type { User, Order, BlogPost } from '@/lib/types';
import { collection, doc, Firestore, Transaction, DocumentSnapshot, addDoc, runTransaction, getDoc } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/server';
import { generateSeoArticle } from '@/ai/flows/seo-article-flow';

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


/**
 * Processes a new order within a Firestore transaction.
 * This function encapsulates the logic for:
 * - Updating user's balance and total spent.
 * - Checking for rank promotion and applying rewards.
 * - Calculating and applying multi-level affiliate commissions.
 * - Creating the order document.
 * - Creating affiliate transaction documents for each level.
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

    // 4. Handle multi-level affiliate commissions
    let currentReferrerId = userData.referrerId;
    let directReferrer: DocumentSnapshot | null = null;

    // Get the direct referrer (Level 1) first to apply their specific commission rate
    if (currentReferrerId) {
        const directReferrerRef = doc(firestore, 'users', currentReferrerId);
        directReferrer = await transaction.get(directReferrerRef);

        if (directReferrer.exists()) {
            const referrerData = directReferrer.data() as User;
            const affiliateLevel = referrerData.affiliateLevel || 'برونزي';
            const directCommissionRate = AFFILIATE_LEVELS[affiliateLevel].commission / 100;
            const directCommissionAmount = cost * directCommissionRate;

            if (directCommissionAmount > 0) {
                 transaction.update(directReferrerRef, {
                    affiliateEarnings: (referrerData.affiliateEarnings || 0) + directCommissionAmount
                });
                const newTransactionRef = doc(collection(firestore, `users/${currentReferrerId}/affiliateTransactions`));
                transaction.set(newTransactionRef, {
                    userId: currentReferrerId,
                    referralId: userId,
                    orderId: newOrderRef.id,
                    amount: directCommissionAmount,
                    transactionDate: new Date().toISOString(),
                    level: 1,
                });
            }
        }
    }

    // Now, handle the multi-level (network) commissions for levels 2 and up
    let indirectReferrerId = directReferrer?.exists() ? (directReferrer.data() as User).referrerId : null;

    for (let i = 0; i < MULTI_LEVEL_COMMISSIONS.length && indirectReferrerId; i++) {
        const commissionRate = MULTI_LEVEL_COMMISSIONS[i] / 100;
        const commissionAmount = cost * commissionRate;
        const level = i + 2; // Starts from level 2

        if (commissionAmount > 0) {
            const referrerRef = doc(firestore, 'users', indirectReferrerId);
            const referrerDoc = await transaction.get(referrerRef);

            if (referrerDoc.exists()) {
                const referrerData = referrerDoc.data() as User;
                
                transaction.update(referrerRef, {
                    affiliateEarnings: (referrerData.affiliateEarnings || 0) + commissionAmount
                });

                const newTransactionRef = doc(collection(firestore, `users/${indirectReferrerId}/affiliateTransactions`));
                transaction.set(newTransactionRef, {
                    userId: indirectReferrerId,
                    referralId: userId,
                    orderId: newOrderRef.id,
                    amount: commissionAmount,
                    transactionDate: new Date().toISOString(),
                    level: level,
                });

                indirectReferrerId = referrerData.referrerId;
            } else {
                break;
            }
        }
    }


    return { promotion };
}


/**
 * Gives the user a $1 ad credit and generates a new SEO-optimized blog post.
 * This is a server-side function.
 * @param userId The ID of the user claiming the reward.
 */
export async function claimDailyRewardAndGenerateArticle(userId: string): Promise<void> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        throw new Error("Firestore is not initialized.");
    }
     if (!process.env.GEMINI_API_KEY) {
        throw new Error("الموارد قيد التجميع حاليًا، يرجى المحاولة لاحقًا.");
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

        // Array of potential topics for the AI to write about
        const topics = [
            "أسرار زيادة متابعين تيك توك في 2024",
            "كيفية إنشاء حملة إعلانية ناجحة على فيسبوك",
            "دليل المبتدئين لتصدر نتائج بحث جوجل",
            "استراتيجيات التسويق عبر انستغرام للشركات الصغيرة",
            "لماذا يجب أن تستخدم حسابات الوكالة الإعلانية؟",
            "أفضل الممارسات لزيادة التفاعل على منشوراتك"
        ];
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];

        // 1. Generate the article using the Genkit flow
        const article = await generateSeoArticle({ topicSuggestion: randomTopic });
        
        // 2. Update user balance and create blog post in the same transaction
        const blogPostsRef = collection(firestore, 'blogPosts');

        // Add $1 to the user's adBalance and update last claimed date
        const newAdBalance = (userData.adBalance || 0) + 1;
        transaction.update(userRef, { 
            adBalance: newAdBalance,
            lastRewardClaimedAt: new Date().toISOString() 
        });

        // Create the new blog post document
        const newPostRef = doc(blogPostsRef);
        const newPostData: Omit<BlogPost, 'id'> = {
            title: article.title,
            content: article.content,
            authorId: "ai_content_generator", // Special author ID for AI
            publishDate: new Date().toISOString(),
        };
        transaction.set(newPostRef, newPostData);
    });
}
