
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DollarSign,
  Rocket,
  PlusCircle,
  Briefcase,
  ChevronLeft,
  Star,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import type { User as UserType, Order, Service } from '@/lib/types';
import { getRankForSpend } from '@/lib/service';
import { QuickOrderForm } from './_components/quick-order-form';
import { DailyRewardCard } from './_components/daily-reward-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


function DealOfTheDay() {
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settingsData, isLoading: settingsLoading } = useDoc<any>(settingsDocRef);
    
    const serviceId = settingsData?.dealOfTheDay;

    const serviceDocRef = useMemoFirebase(() => (firestore && serviceId) ? doc(firestore, 'services', serviceId) : null, [firestore, serviceId]);
    const { data: serviceData, isLoading: serviceLoading } = useDoc<Service>(serviceDocRef);

    const isLoading = settingsLoading || serviceLoading;

    if (isLoading) {
        return <Skeleton className="h-44 w-full" />;
    }
    
    if (!serviceData) {
        return null; // Don't render if no deal is set
    }
    
    const prefillUrl = `/dashboard/mass-order?prefill=${encodeURIComponent(`${serviceData.id}| |`)}`;


    return (
        <Card className="bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border-primary/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Star className="text-yellow-400" />
                    <span>صفقة اليوم</span>
                </CardTitle>
                <CardDescription>
                    {serviceData.platform} - {serviceData.category}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-4xl font-bold font-mono">${serviceData.price.toFixed(3)}</p>
                <p className="text-xs text-muted-foreground">/ لكل 1000</p>
            </CardContent>
             <CardContent>
                <Button asChild className="w-full">
                   <Link href={prefillUrl}>
                     <ChevronLeft className="h-4 w-4 me-2" />
                        اطلب الآن
                   </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                <div className='mb-4'>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                 <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-12" />
                    <Skeleton className="h-12" />
                </div>
                <Skeleton className="h-96" />
            </div>
             <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <Skeleton className="h-28" />
                    <Skeleton className="h-28" />
                </div>
                <Skeleton className="h-44 w-full" />
                <Skeleton className="h-40" />
             </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userData, isLoading: isUserDataLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

    const ordersQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/orders`), orderBy('orderDate', 'desc'), limit(5)) : null, [authUser, firestore]);
    const { data: recentOrders, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

    const isLoading = isUserLoading || isUserDataLoading || areOrdersLoading;

    if (isLoading || !userData || !authUser) {
        return <DashboardSkeleton />;
    }
  
    const rank = getRankForSpend(userData?.totalSpent ?? 0);

    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                <div className='mb-4'>
                    <h1 className='text-3xl font-bold font-headline'>مرحباً بعودتك، {userData?.name || 'Hagaaty'}!</h1>
                    <p className='text-muted-foreground'>هذه هي لوحة التحكم الخاصة بك. كل شيء تحت السيطرة.</p>
                </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full text-md py-6" asChild>
                        <Link href="/dashboard/campaigns">
                            <PlusCircle className="ml-2 h-5 w-5" />
                            إنشاء حملة إعلانية
                        </Link>
                    </Button>
                    <Button variant="outline" className="w-full text-md py-6" asChild>
                        <Link href="/dashboard/agency-accounts">
                            <Briefcase className="ml-2 h-5 w-5" />
                            فتح حسابات إعلانية (ايجنسي)
                        </Link>
                    </Button>
                </div>
                
                <QuickOrderForm user={authUser} userData={userData} />
                
            </div>

            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    <Card>
                        <CardHeader className="pb-2 flex-row items-center justify-between">
                            <CardDescription>الرصيد الأساسي</CardDescription>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-3xl font-bold">${(userData?.balance ?? 0).toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>رتبتك الحالية</CardDescription>
                            <CardTitle className="text-xl text-primary">{rank.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">خصم {rank.discount}% على كل الطلبات</p>
                        </CardHeader>
                    </Card>
                </div>
                
                <DealOfTheDay />
                <DailyRewardCard user={userData} onClaim={forceDocUpdate} />
                
            </div>
        </div>
    );
}
