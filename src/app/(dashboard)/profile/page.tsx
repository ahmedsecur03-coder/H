'use client';
import type { User as UserType } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ProfileClientPage } from './_components/profile-client-page';
import { Skeleton } from '@/components/ui/skeleton';

function ProfileSkeleton() {
    return (
        <div className="space-y-8 pb-8">
            <div>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <Skeleton className="h-44 w-full" />
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
             </div>
        </div>
    );
}

export default function ProfilePage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserType>(userDocRef);

    const isLoading = isUserLoading || isUserDataLoading;
    
    if (isLoading || !user || !userData) {
        return <ProfileSkeleton />;
    }

    return <ProfileClientPage serverUser={user} userData={userData} />;
}
