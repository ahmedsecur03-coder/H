

import type { User } from '@/lib/types';
import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
import { SettingsForm } from './_components/settings-form';

async function getData(userId: string) {
    const { firestore } = initializeFirebaseServer();
    if(!firestore) return null;

    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if(!userDoc.exists()) return null;

    return userDoc.data() as User;
}


export default async function SettingsPage() {
  const { user } = await getAuthenticatedUser();
  if (!user) return null;

  const userData = await getData(user.uid);
  const preferences = userData?.notificationPreferences || { newsletter: false, orderUpdates: true };
  
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">الإعدادات</h1>
        <p className="text-muted-foreground">
          إدارة تفضيلات حسابك وإعدادات الإشعارات.
        </p>
      </div>
      <SettingsForm preferences={preferences} />
    </div>
  );
}
