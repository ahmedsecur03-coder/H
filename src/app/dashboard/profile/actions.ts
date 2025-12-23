
'use server';

import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { FirebaseError } from 'firebase-admin';

// Schema for profile data validation
const profileSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل."),
  avatarUrl: z.string().url("الرجاء إدخال رابط صورة صالح.").optional().or(z.literal('')),
});

// Schema for password change validation
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة."),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."),
});


export async function updateProfileAction(data: unknown) {
  const { user } = await getAuthenticatedUser();
  const { firestore } = initializeFirebaseServer();
  const auth = getAuth(initializeFirebaseServer().firebaseApp!);

  if (!user || !firestore || !auth) {
    throw new Error('المستخدم غير مصادق عليه أو فشل تهيئة Firebase.');
  }

  const result = profileSchema.safeParse(data);
  if (!result.success) {
    throw new Error('البيانات المدخلة غير صالحة.');
  }
  const { name, avatarUrl } = result.data;

  const userDocRef = firestore.collection('users').doc(user.uid);
  
  try {
    // Start both updates in parallel
    const authUpdatePromise = auth.updateUser(user.uid, {
      displayName: name,
      photoURL: avatarUrl,
    });

    const firestoreUpdatePromise = userDocRef.update({
      name: name,
      avatarUrl: avatarUrl,
    });

    // Wait for both to complete
    await Promise.all([authUpdatePromise, firestoreUpdatePromise]);

    revalidatePath('/dashboard/profile');
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw new Error('فشل تحديث الملف الشخصي.');
  }
}

export async function updatePasswordAction(data: unknown) {
  const { user } = await getAuthenticatedUser();
  const { firebaseApp } = initializeFirebaseServer();

  if (!user || !firebaseApp) {
    throw new Error('المستخدم غير مصادق عليه أو فشل تهيئة Firebase.');
  }

  const result = passwordSchema.safeParse(data);
  if (!result.success) {
    throw new Error('البيانات المدخلة غير صالحة.');
  }
  const { newPassword } = result.data;

  try {
    const auth = getAuth(firebaseApp);
    await auth.updateUser(user.uid, {
      password: newPassword,
    });
    // Password update doesn't require revalidation of data paths
  } catch (error: any) {
     if ((error as FirebaseError).code === 'auth/requires-recent-login') {
      throw new Error('هذه العملية حساسة وتتطلب إعادة تسجيل الدخول. الرجاء تسجيل الخروج ثم الدخول مرة أخرى.');
    }
    console.error("Error updating password:", error);
    throw new Error('فشل تغيير كلمة المرور. تأكد من أن كلمة المرور الحالية صحيحة.');
  }
}
