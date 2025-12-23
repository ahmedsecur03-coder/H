
import type { User as UserType } from '@/lib/types';
import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { ProfileClientPage } from './_components/profile-client-page';
import { Skeleton } from '@/components/ui/skeleton';
import { notFound, redirect } from 'next/navigation';

async function getUserData(userId: string) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return null;
    const userDocRef = firestore.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) return null;
    return userDoc.data() as UserType;
}

export default async function ProfilePage() {
    const { user: serverUser } = await getAuthenticatedUser();
    
    if (!serverUser) {
        // This should ideally be handled by the layout, but as a safeguard:
        redirect('/login');
    }

    const userData = await getUserData(serverUser.uid);

    if (!userData) {
        // This might happen if the Firestore doc is not created yet.
        // Show a loading state or a message.
        return (
             <div className="text-center py-20">
                <h2 className="text-2xl font-bold">خطأ في تحميل البيانات</h2>
                <p className="text-muted-foreground">لم نتمكن من تحميل بيانات ملفك الشخصي. حاول تحديث الصفحة.</p>
            </div>
        );
    }
    
    return <ProfileClientPage serverUser={serverUser} userData={{...userData, id: serverUser.uid}} />;
}
