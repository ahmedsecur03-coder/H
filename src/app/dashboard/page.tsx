
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
import { getRankForSpend, RANKS } from '@/lib/service';
import { QuickOrderForm } from './_components/quick-order-form';
import { DailyRewardCard } from './_components/daily-reward-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { SMM_SERVICES } from '@/lib/smm-services';
import { useMemo } from 'react';


function DealOfTheDay() {
    const getDayOfYear = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now as any) - (start as any);
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };

    const service = useMemo(() => {
        if (!SMM_SERVICES || SMM_SERVICES.length === 0) return null;
        const dayOfYear = getDayOfYear();
        const dealIndex = dayOfYear % SMM_SERVICES.length;
        return SMM_SERVICES[dealIndex];
    }, []);

    if (!service) {
        return null; 
    }
    
    const prefillUrl = `/dashboard/mass-order?prefill=${encodeURIComponent(`${service.id}| |`)}`;

    return (
        <Card className="bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border-primary/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Star className="text-yellow-400" />
                    <span>صفقة اليوم</span>
                </CardTitle>
                <CardDescription>
                    {service.platform} - {service.category}
                </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-4xl font-bold font-mono">${service.price.toFixed(3)}</p>
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
        <div className="space-y-6 pb-4">
             <div className='mb-4'>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Skeleton className="h-16" />
                        <Skeleton className="h-16" />
                    </div>
                    <Skeleton className="h-96" />
                </div>
                <div className="lg:col-span-1 space-y-4">
                     <Skeleton className="h-28" />
                     <Skeleton className="h-28" />
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-40" />
                </div>
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
    const currentRankIndex = RANKS.findIndex(r => r.name === rank.name);
    const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;

    const progressToNextRank = nextRank ? ((userData.totalSpent - rank.spend) / (nextRank.spend - rank.spend)) * 100 : 100;
    const amountToNextRank = nextRank ? nextRank.spend - userData.totalSpent : 0;

    return (
        <div className="space-y-6 pb-4">
            <div className='mb-4'>
                <h1 className='text-3xl font-bold font-headline'>مرحباً بعودتك، {userData?.name || 'Hagaaty'}!</h1>
                <p className='text-muted-foreground'>هذه هي لوحة التحكم الخاصة بك. كل شيء تحت السيطرة.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">

                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
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

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
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
                        </CardHeader>
                        <CardContent>
                            {nextRank ? (
                                <>
                                    <Progress value={progressToNextRank} className="h-2 my-2" />
                                    <p className="text-xs text-muted-foreground text-center">
                                       أنفق ${amountToNextRank.toFixed(2)} للوصول لرتبة {nextRank.name} والحصول على خصم {nextRank.discount}%.
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm font-semibold text-center text-primary">🎉 أنت في أعلى رتبة!</p>
                            )}
                        </CardContent>
                    </Card>
                    <DealOfTheDay />
                    <DailyRewardCard user={userData} onClaim={forceDocUpdate} />
                </div>
            </div>
        </div>
    );
}
