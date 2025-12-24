
'use client';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User as UserType } from '@/lib/types';
import { QuickOrderForm } from '../_components/quick-order-form';
import { Skeleton } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation';


function ServicesPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}

export default function ServicesPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserType>(userDocRef);

    const isLoading = isUserLoading || isUserDataLoading;

    if (isLoading || !userData || !authUser) {
        if (!isUserLoading && !authUser) {
            redirect('/login');
        }
        return <ServicesPageSkeleton />;
    }

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className='text-3xl font-bold font-headline'>كل الخدمات</h1>
                <p className='text-muted-foreground'>أضف طلبًا جديدًا بسرعة وسهولة من هنا.</p>
            </div>
            <div className="max-w-2xl mx-auto">
                 <QuickOrderForm user={authUser} userData={userData} />
            </div>
        </div>
    );
}
