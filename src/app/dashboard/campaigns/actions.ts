
'use server';

import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import type { Campaign, User as UserType } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Basic validation schema
const campaignSchema = {
    name: (v: any) => typeof v === 'string' && v.length > 0,
    platform: (v: any) => ['Google', 'Facebook', 'TikTok', 'Snapchat'].includes(v),
    goal: (v: any) => ['زيارات للموقع', 'مشاهدات فيديو', 'تفاعل مع المنشور', 'زيادة الوعي', 'تحويلات'].includes(v),
    targetAudience: (v: any) => typeof v === 'string' && v.length > 0,
    budgetAmount: (v: any) => typeof v === 'number' && v > 0,
    duration: (v: any) => typeof v === 'number' && v > 0,
};


export async function createCampaign(data: {
    name: string;
    platform: Campaign['platform'];
    goal: Campaign['goal'];
    targetAudience: string;
    budgetAmount: number;
    duration: number;
}) {
    // 1. Authenticate user and initialize server-side Firebase
    const { user } = await getAuthenticatedUser();
    const { firestore } = initializeFirebaseServer();

    if (!user || !firestore) {
        throw new Error("المستخدم غير مصادق عليه أو فشل تهيئة Firebase.");
    }
    
    // 2. Validate input data
    if (!campaignSchema.name(data.name) || !campaignSchema.platform(data.platform) || !campaignSchema.goal(data.goal) || !campaignSchema.targetAudience(data.targetAudience) || !campaignSchema.budgetAmount(data.budgetAmount) || !campaignSchema.duration(data.duration)) {
        throw new Error('بيانات الحملة غير صالحة.');
    }


    // 3. Use a transaction to ensure data consistency
    const userDocRef = firestore.collection('users').doc(user.uid);
    const campaignsColRef = userDocRef.collection('campaigns');

    try {
        await firestore.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                throw new Error("المستخدم غير موجود.");
            }

            const userData = userDoc.data() as UserType;
            const currentAdBalance = userData.adBalance ?? 0;

            if (currentAdBalance < data.budgetAmount) {
                throw new Error("رصيد الإعلانات غير كافٍ لهذه الميزانية.");
            }

            // Deduct budget from user's ad balance
            transaction.update(userDocRef, { adBalance: currentAdBalance - data.budgetAmount });

            // Create the new campaign document
            const newCampaignData: Omit<Campaign, 'id'> = {
                userId: user.uid,
                name: data.name,
                platform: data.platform,
                goal: data.goal,
                targetAudience: data.targetAudience,
                startDate: new Date().toISOString(),
                endDate: undefined,
                budget: data.budgetAmount,
                durationDays: data.duration,
                spend: 0,
                status: 'بانتظار المراجعة',
                impressions: 0,
                clicks: 0,
                results: 0,
                ctr: 0,
                cpc: 0,
            };
            
            // In Admin SDK, we add to collection like this inside a transaction
            const newCampaignRef = campaignsColRef.doc();
            transaction.set(newCampaignRef, newCampaignData);
        });
        
        // 4. Revalidate path to show the new campaign in the UI
        revalidatePath('/dashboard/campaigns');
        
        return { success: true, message: 'تم إنشاء حملتك وهي الآن قيد المراجعة.' };

    } catch (error: any) {
        console.error("Error creating campaign:", error);
        // Re-throw specific, safe error messages
        if (error.message.includes("رصيد الإعلانات غير كاف")) {
            throw error;
        }
        throw new Error('فشل إنشاء الحملة. يرجى المحاولة مرة أخرى.');
    }
}
