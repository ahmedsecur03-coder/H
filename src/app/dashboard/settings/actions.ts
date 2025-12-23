'use server';

import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { revalidatePath } from 'next/cache';

// Basic validation schema
const preferencesSchema = {
  newsletter: (value: any) => typeof value === 'boolean',
  orderUpdates: (value: any) => typeof value === 'boolean',
};

export async function updateNotificationPreferences(preferences: { newsletter: boolean; orderUpdates: boolean }) {
  const { user } = await getAuthenticatedUser();
  const { firestore } = initializeFirebaseServer();

  if (!user || !firestore) {
    throw new Error('المستخدم غير مصادق عليه أو فشل تهيئة Firebase.');
  }
  
  if (!preferencesSchema.newsletter(preferences.newsletter) || !preferencesSchema.orderUpdates(preferences.orderUpdates)) {
      throw new Error('البيانات المدخلة غير صالحة.');
  }

  const userDocRef = firestore.collection('users').doc(user.uid);

  try {
    await userDocRef.update({
      notificationPreferences: preferences,
    });
    // Revalidate the path to ensure the settings page reflects the new data
    revalidatePath('/dashboard/settings');
  } catch (error: any) {
    console.error("Error updating notification preferences:", error);
    // In a real app, you might want to throw a more specific error.
    throw new Error('فشل تحديث تفضيلات الإشعارات.');
  }
}
