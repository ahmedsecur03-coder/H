
'use client';

import type { User } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SettingsForm } from './_components/settings-form';
import { Skeleton } from '@/components/ui/skeleton';

function SettingsSkeleton() {
    return (
         <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-9 w-1/4" />
                <Skeleton className="h-5 w-1/2 mt-2" />
            </div>
            <Skeleton className="h-80 w-full" />
        </div>
    );
}

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);

    const isLoading = isUserLoading || isUserDataLoading;

    if (isLoading || !userData) {
        return <SettingsSkeleton />;
    }
  
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
