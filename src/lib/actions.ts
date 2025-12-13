
'use server';

import type { User, BlogPost } from '@/lib/types';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/server';
import { generateSeoArticle } from '@/ai/flows/seo-article-flow';

/**
 * Gives the user a $1 ad credit and generates a new SEO-optimized blog post.
 * This is a server-side function.
 * @param userId The ID of the user claiming the reward.
 */
export async function claimDailyRewardAndGenerateArticle(userId: string): Promise<void> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        throw new Error("خوادم المكافآت غير متاحة حاليًا، يرجى المحاولة مرة أخرى لاحقًا.");
    }
     if (!process.env.GEMINI_API_KEY) {
        throw new Error("الموارد الإبداعية قيد التجميع حاليًا، يرجى المحاولة مرة أخرى لاحقًا.");
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
