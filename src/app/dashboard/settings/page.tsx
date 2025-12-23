'use client';

import type { User } from '@/lib/types';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { SettingsForm } from './_components/settings-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
    const { data: userData, isLoading: isUserDataLoading, forceDocUpdate } = useDoc<User>(userDocRef);

    const isLoading = isUserLoading || isUserDataLoading;

    const handleUpdatePreferences = async (preferences: { newsletter: boolean; orderUpdates: boolean }) => {
        if (!userDocRef) {
            toast({ variant: "destructive", title: "خطأ", description: "المستخدم غير موجود." });
            return;
        }

        try {
            await updateDoc(userDocRef, {
              notificationPreferences: preferences,
            });
            toast({ title: 'نجاح', description: 'تم حفظ تفضيلاتك بنجاح.' });
            forceDocUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message || 'فشل حفظ التغييرات.' });
        }
    };


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
            <SettingsForm preferences={preferences} onSave={handleUpdatePreferences} />
        </div>
    );
}
