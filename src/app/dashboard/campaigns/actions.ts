'use server';

import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import type { Campaign, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const campaignSchema = z.object({
  name: z.string().min(1, 'اسم الحملة مطلوب.'),
  platform: z.enum(['Google', 'Facebook', 'TikTok', 'Snapchat']),
  goal: z.enum(['زيارات للموقع', 'مشاهدات فيديو', 'تفاعل مع المنشور', 'زيادة الوعي', 'تحويلات']),
  targetAudience: z.string().min(10, 'وصف الجمهور المستهدف يجب أن يكون 10 أحرف على الأقل.'),
  budget: z.coerce.number().min(5, 'الحد الأدنى للميزانية هو 5$.'),
  durationDays: z.coerce.number().int().min(1, 'المدة يجب أن تكون يومًا واحدًا على الأقل.'),
});

export async function createCampaignAction(formData: FormData) {
  const { user } = await getAuthenticatedUser();
  const { firestore } = initializeFirebaseServer();

  if (!user || !firestore) {
    return { success: false, error: 'المستخدم غير مصادق عليه أو فشل تهيئة Firebase.' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validation = campaignSchema.safeParse(rawData);

  if (!validation.success) {
    const errorMessages = validation.error.errors.map(e => e.message).join(' ');
    return { success: false, error: errorMessages };
  }
  
  const { name, platform, goal, targetAudience, budget, durationDays } = validation.data;
  
  try {
    const userDocRef = firestore.collection('users').doc(user.uid);
    const campaignsColRef = userDocRef.collection('campaigns');

    await firestore.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        throw new Error('المستخدم غير موجود.');
      }

      const userData = userDoc.data() as User;
      const currentAdBalance = userData.adBalance ?? 0;

      if (currentAdBalance < budget) {
        throw new Error('رصيد الإعلانات غير كافٍ لهذه الميزانية.');
      }
      
      transaction.update(userDocRef, { adBalance: currentAdBalance - budget });
      
      const newCampaignRef = campaignsColRef.doc();
      const newCampaignData: Omit<Campaign, 'id'> = {
        userId: user.uid,
        name,
        platform,
        goal,
        targetAudience,
        budget,
        durationDays,
        startDate: new Date().toISOString(),
        endDate: undefined,
        spend: 0,
        status: 'بانتظار المراجعة',
        impressions: 0,
        clicks: 0,
        results: 0,
        ctr: 0,
        cpc: 0,
      };
      transaction.set(newCampaignRef, newCampaignData);
    });

    revalidatePath('/dashboard/campaigns');
    return { success: true, error: null };

  } catch (error: any) {
    console.error('Create Campaign Action Error:', error);
    return { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء إنشاء الحملة.' };
  }
}
