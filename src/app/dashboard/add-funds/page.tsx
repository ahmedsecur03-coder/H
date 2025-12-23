
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { User as UserType } from "@/lib/types";
import { AddFundsClientPage } from './_components/add-funds-client';

function AddFundsSkeleton() {
    return (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <Card><CardContent className="p-4"><Skeleton className="h-96" /></CardContent></Card>
            </div>
            <div className="space-y-6">
                <Card><CardContent className="p-4"><Skeleton className="h-64" /></CardContent></Card>
            </div>
       </div>
    )
}

export default function AddFundsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userData, isLoading: userLoading } = useDoc<UserType>(userDocRef);

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settingsData, isLoading: settingsLoading } = useDoc<any>(settingsDocRef);
    
    const isLoading = userLoading || settingsLoading;

    if (isLoading || !userData || !settingsData) return <AddFundsSkeleton />;

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">شحن الرصيد</h1>
                <p className="text-muted-foreground">
                اختر طريقة الدفع المناسبة لك لإضافة رصيد إلى حسابك.
                </p>
            </div>
            <AddFundsClientPage userData={userData} settingsData={settingsData} />
        </div>
    );
}
