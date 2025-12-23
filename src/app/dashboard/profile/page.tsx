'use client';

import type { User as UserType } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { ProfileClientPage } from './_components/profile-client-page';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import { redirect } from 'next/navigation';

function ProfilePageSkeleton() {
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
    )
}


export default function ProfilePage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData, isLoading: isUserDataLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

    if (isUserLoading || isUserDataLoading) {
        return <ProfilePageSkeleton />;
    }
    
    if (!authUser || !userData) {
       redirect('/login');
    }
    
    return <ProfileClientPage userData={{...userData, id: authUser.uid}} onUpdate={forceDocUpdate} />;
}

