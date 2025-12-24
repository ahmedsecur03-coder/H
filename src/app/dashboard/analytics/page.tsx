'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { AnalyticsClientPage } from './_components/analytics-client-page';
import { Skeleton } from '@/components/ui/skeleton';

function AnalyticsPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Skeleton className="h-80" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-80" />
                </div>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    // Query for the last 30 days of orders
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const ordersQuery = useMemoFirebase(
        () => (user ? query(
            collection(firestore, `users/${user.uid}/orders`),
            where('orderDate', '>=', thirtyDaysAgoISO)
        ) : null),
        [user, firestore]
    );

    const { data: orders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

    if (isUserLoading || isOrdersLoading || !orders) {
        return <AnalyticsPageSkeleton />;
    }

    return <AnalyticsClientPage orders={orders} />;
}
