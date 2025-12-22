
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { initializeFirebaseServer } from "@/firebase/server";
import { getAuthenticatedUser } from "@/firebase/server-auth";
import { doc, getDoc } from "firebase/firestore";
import type { User as UserType } from "@/lib/types";
import { AddFundsClientPage } from "./_components/add-funds-client";

async function getData(userId: string) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return { userData: null, settingsData: null };
    
    const userDocRef = doc(firestore, 'users', userId);
    const settingsDocRef = doc(firestore, 'settings', 'global');
    
    const [userDoc, settingsDoc] = await Promise.all([
        getDoc(userDocRef),
        getDoc(settingsDocRef)
    ]);
    
    const userData = userDoc.exists() ? userDoc.data() as UserType : null;
    const settingsData = settingsDoc.exists() ? settingsDoc.data() : null;

    return { userData, settingsData };
}

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

export default async function AddFundsPage() {
    const { user } = await getAuthenticatedUser();
    if (!user) return null;

    const { userData, settingsData } = await getData(user.uid);
    if (!userData || !settingsData) return <AddFundsSkeleton />;

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
