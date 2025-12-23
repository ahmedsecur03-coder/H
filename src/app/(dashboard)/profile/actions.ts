
'use server';

import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { revalidatePath } from 'next/cache';
import {
  getAuth,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

const profileSchema = {
  name: (value: any) => typeof value === 'string' && value.length >= 2,
  avatarUrl: (value: any) => typeof value === 'string' && (value === '' || /^https?:\/\//.test(value)),
};

export async function updateProfileAction(values: { name: string, avatarUrl?: string }) {
  const { user } = await getAuthenticatedUser();
  const { firebaseApp } = initializeFirebaseServer();
  
  if (!user || !firebaseApp) {
    throw new Error('المستخدم غير مصادق عليه أو فشل تهيئة Firebase.');
  }

  if (!profileSchema.name(values.name) || (values.avatarUrl && !profileSchema.avatarUrl(values.avatarUrl))) {
      throw new Error('البيانات المدخلة غير صالحة.');
  }

  try {
    const auth = getAuth(firebaseApp);
    await auth.updateUser(user.uid, {
        displayName: values.name,
        photoURL: values.avatarUrl,
    });
    
    // Also update Firestore
    const { firestore } = initializeFirebaseServer();
    if (firestore) {
        const userDocRef = firestore.collection('users').doc(user.uid);
        await userDocRef.update({
            name: values.name,
            avatarUrl: values.avatarUrl,
        });
    }

    revalidatePath('/dashboard/profile');
  } catch (error: any) {
    console.error("Error updating profile:", error);
    throw new Error(error.message || 'فشل تحديث الملف الشخصي.');
  }
}

const passwordSchemaValidation = {
    currentPassword: (value: any) => typeof value === 'string' && value.length >= 1,
    newPassword: (value: any) => typeof value === 'string' && value.length >= 6,
};


export async function updatePasswordAction(values: { currentPassword: string, newPassword: string }) {
  const { user: serverUser } = await getAuthenticatedUser();
  if (!serverUser || !serverUser.email) {
    throw new Error("المستخدم غير مصادق عليه أو لا يوجد بريد إلكتروني مرتبط.");
  }
  
  if (!passwordSchemaValidation.currentPassword(values.currentPassword) || !passwordSchemaValidation.newPassword(values.newPassword)) {
      throw new Error("البيانات المدخلة غير صالحة.");
  }

  // This is a placeholder for a more secure server-side implementation.
  // Re-authentication cannot be done purely on the server without client interaction.
  // A proper implementation would involve a client-side call to reauthenticate,
  // then sending a short-lived token to the server to perform the password update.
  // For this prototype, we'll throw an error explaining this limitation.
  
  throw new Error("لا يمكن تغيير كلمة المرور من الخادم مباشرة. يتطلب هذا الإجراء إعادة مصادقة من طرف العميل أولاً.");
  
  // Example of what the client-side code would look like:
  /*
  import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user && user.email) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    
    try {
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      // Password updated successfully
    } catch (error) {
      // Handle re-authentication error (e.g., wrong password)
    }
  }
  */
}
