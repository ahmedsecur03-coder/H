
'use client';

import type { User as UserType } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { ProfileClientPage } from './_components/profile-client-page';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';

function ProfilePageSkeleton() {
    return (
        <div class="space-y-8 pb-8">
            <div>
                <Skeleton class="h-9 w-1/3" />
                <Skeleton class="h-5 w-2/3 mt-2" />
            </div>
            <Card class="overflow-hidden">
                <div class="p-6 flex flex-col md:flex-row items-center gap-6">
                     <Skeleton class="h-28 w-28 rounded-full" />
                    <div class="flex-1 text-center md:text-right space-y-2">
                         <Skeleton class="h-8 w-1/2 mx-auto md:mx-0" />
                         <Skeleton class="h-5 w-3/4 mx-auto md:mx-0" />
                        <div class="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                             <Skeleton class="h-6 w-24 rounded-full" />
                             <Skeleton class="h-6 w-32 rounded-full" />
                             <Skeleton class="h-6 w-28 rounded-full" />
                        </div>
                    </div>
                </div>
            </Card>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton class="h-64 w-full" />
                <Skeleton class="h-64 w-full" />
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
       redirect('/auth/login');
    }
    
    return <ProfileClientPage userData={{...userData, id: authUser.uid}} onUpdate={forceDocUpdate} />;
}
