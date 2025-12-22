
import type { User as UserType } from '@/lib/types';
import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
import { ProfileClientPage } from './_components/profile-client-page';

async function getData(userId: string) {
    const { firestore } = initializeFirebaseServer();
    if(!firestore) return null;

    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if(!userDoc.exists()) return null;

    return userDoc.data() as UserType;
}

export default async function ProfilePage() {
    const { user } = await getAuthenticatedauThenticatedUser();
    if (!user) return null;

    const userData = await getData(user.uid);
    if (!userData) {
        return <p>لا يمكن تحميل بيانات المستخدم.</p>
    }

    return <ProfileClientPage serverUser={user} userData={userData} />;
}
