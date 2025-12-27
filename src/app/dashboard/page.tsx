
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  DollarSign,
  Rocket,
  PlusCircle,
  Briefcase,
  ChevronLeft,
  Star,
  Crown,
  ShoppingBag,
  ListOrdered,
  Wallet,
  Megaphone,
  TrendingUp,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, where } from 'firebase/firestore';
import type { User as UserType, Order, Service, AgencyAccount, Campaign } from '@/lib/types';
import { getRankForSpend, RANKS } from '@/lib/service';
import { QuickOrderForm } from './_components/quick-order-form';
import { DailyRewardCard } from './_components/daily-reward-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { SMM_SERVICES } from '@/lib/smm-services';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const statusVariant = {
  'مكتمل': 'default',
  'قيد التنفيذ': 'secondary',
  'ملغي': 'destructive',
  'جزئي': 'outline',
} as const;


function DashboardSkeleton() {
    return (
        <div className="space-y-6 pb-4">
             <div className='mb-4'>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-[500px]" />
                    <Skeleton className="h-64" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                     <Skeleton className="h-40" />
                     <Skeleton className="h-44 w-full" />
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
    
    const accountsQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/agencyAccounts`)) : null, [authUser, firestore]);
    const { data: agencyAccounts, isLoading: areAccountsLoading } = useCollection<AgencyAccount>(accountsQuery);

    const campaignsQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/campaigns`), where('status', '==', 'نشط')) : null, [authUser, firestore]);
    const { data: activeCampaigns, isLoading: areCampaignsLoading } = useCollection<Campaign>(campaignsQuery);


    const isLoading = isUserLoading || isUserDataLoading || areOrdersLoading || areAccountsLoading || areCampaignsLoading;
    
    const totalAgencyBalance = useMemo(() => agencyAccounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0, [agencyAccounts]);


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
                <h1 className='text-xl md:text-3xl font-bold font-headline'>مرحباً بعودتك، {userData?.name || 'Hagaaty'}!</h1>
                <p className='text-muted-foreground'>هذه هي لوحة التحكم الخاصة بك. كل شيء تحت السيطرة.</p>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button className="w-full text-lg py-7" asChild>
                    <Link href="/dashboard/campaigns/new">
                        <PlusCircle className="ml-2 h-5 w-5" />
                        إنشاء حملة جديدة
                    </Link>
                </Button>
                <Button variant="outline" className="w-full text-lg py-7" asChild>
                    <Link href="/dashboard/agency-accounts">
                        <Briefcase className="ml-2 h-5 w-5" />
                        إدارة حسابات الوكالة
                    </Link>
                </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">

                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    <QuickOrderForm user={authUser} userData={userData} />

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline text-xl">آخر الطلبات</CardTitle>
                                <CardDescription>نظرة سريعة على آخر 5 طلبات قمت بها.</CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard/orders">
                                    <ListOrdered className="ml-2 h-4 w-4" />
                                    عرض الكل
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>الخدمة</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="text-right">التكلفة</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders && recentOrders.length > 0 ? (
                                        recentOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.serviceName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">${order.charge.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-24 text-center">
                                                لا توجد طلبات حديثة.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                     <DailyRewardCard user={userData} onClaim={forceDocUpdate} />
                     <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>الترقية التالية</CardDescription>
                            <CardTitle className="text-xl text-primary flex items-center gap-2">
                                {nextRank ? <>{nextRank.icon && <nextRank.icon/>} {nextRank.name}</> : <><Crown/> لقد وصلت للقمة!</>}
                            </CardTitle>
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

                </div>
            </div>
        </div>
    );
}
