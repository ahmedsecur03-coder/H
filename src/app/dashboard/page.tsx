
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
  Activity,
  Archive,
  Hourglass,
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
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Sector,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';


function DashboardSkeleton() {
    return (
        <div className="space-y-6 pb-4">
             <div className='mb-4'>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-[400px]" />
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

const chartConfig = {
  orders: { label: 'إنفاق الطلبات', color: 'hsl(var(--chart-1))' },
  campaigns: { label: 'إنفاق الحملات', color: 'hsl(var(--chart-2))' },
  completed: { label: 'مكتمل', color: 'hsl(var(--chart-1))' },
  pending: { label: 'قيد التنفيذ', color: 'hsl(var(--chart-2))' },
  cancelled: { label: 'ملغي', color: 'hsl(var(--chart-3))' },
  partial: { label: 'جزئي', color: 'hsl(var(--chart-4))' },
};

const statusTranslation: Record<Order['status'], keyof typeof chartConfig> = {
    'مكتمل': 'completed',
    'قيد التنفيذ': 'pending',
    'ملغي': 'cancelled',
    'جزئي': 'partial'
};


export default function DashboardPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userData, isLoading: isUserDataLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

    const ordersQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/orders`), orderBy('orderDate', 'desc')) : null, [authUser, firestore]);
    const { data: allOrders, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

    const campaignsQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/campaigns`), orderBy('startDate', 'desc')) : null, [authUser, firestore]);
    const { data: allCampaigns, isLoading: areCampaignsLoading } = useCollection<Campaign>(campaignsQuery);


    const isLoading = isUserLoading || isUserDataLoading || areOrdersLoading || areCampaignsLoading;
    
    const { recentOrders, orderStatusData, performanceData, stats } = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const performanceDataMap = new Map(last7Days.map(date => [date, { date, orders: 0, campaigns: 0 }]));

        let pendingOrdersCount = 0;
        const statusCounts: Record<Order['status'], number> = { 'مكتمل': 0, 'قيد التنفيذ': 0, 'ملغي': 0, 'جزئي': 0 };

        if (allOrders) {
            allOrders.forEach(order => {
                const orderDate = order.orderDate.split('T')[0];
                if (performanceDataMap.has(orderDate)) {
                    performanceDataMap.get(orderDate)!.orders += order.charge;
                }
                statusCounts[order.status]++;
                if (order.status === 'قيد التنفيذ') {
                    pendingOrdersCount++;
                }
            });
        }
        
        let activeCampaignsCount = 0;
        if (allCampaigns) {
            allCampaigns.forEach(campaign => {
                 const campaignDate = campaign.startDate.split('T')[0];
                 if (performanceDataMap.has(campaignDate)) {
                     performanceDataMap.get(campaignDate)!.campaigns += campaign.spend;
                 }
                 if (campaign.status === 'نشط') {
                     activeCampaignsCount++;
                 }
            });
        }

        const orderStatusData = Object.entries(statusCounts)
            .map(([status, value]) => ({
                status: status,
                value: value,
                fill: `var(--color-${statusTranslation[status as Order['status']]})`,
            }))
            .filter(item => item.value > 0);

        return {
            recentOrders: allOrders?.slice(0, 5) || [],
            orderStatusData,
            performanceData: Array.from(performanceDataMap.values()),
            stats: {
                pendingOrders: pendingOrdersCount,
                activeCampaigns: activeCampaignsCount,
                totalSpent: userData?.totalSpent || 0
            }
        };

    }, [allOrders, allCampaigns, userData]);


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
                <p className='text-muted-foreground'>هذه هي لوحة التحكم التحليلية الخاصة بك.</p>
            </div>

             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإنفاق</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الطلبات قيد التنفيذ</CardTitle>
                        <Hourglass className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.pendingOrders}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الحملات النشطة</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold">{stats.activeCampaigns}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">رتبتك الحالية</CardTitle>
                        <Crown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent><div className="text-2xl font-bold text-primary">{rank.name}</div></CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                         <CardHeader>
                            <CardTitle className="font-headline text-xl">تحليل الأداء (آخر 7 أيام)</CardTitle>
                            <CardDescription>مقارنة بين إنفاق الطلبات والحملات.</CardDescription>
                         </CardHeader>
                         <CardContent>
                             <ChartContainer config={chartConfig} className="aspect-video">
                                <ComposedChart data={performanceData}>
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} />
                                    <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                    <Legend />
                                    <Bar dataKey="orders" fill="var(--color-orders)" radius={4} name="الطلبات" />
                                    <Line type="monotone" dataKey="campaigns" stroke="var(--color-campaigns)" strokeWidth={2} name="الحملات" />
                                </ComposedChart>
                            </ChartContainer>
                         </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline text-xl">آخر الطلبات</CardTitle>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard/orders">
                                    <ListOrdered className="ml-2 h-4 w-4" />
                                    عرض الكل
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
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
                                                        <Badge variant={statusTranslation[order.status] ? chartConfig[statusTranslation[order.status]].label === 'مكتمل' ? 'default' : 'secondary' : 'default'}>{order.status}</Badge>
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
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="lg:col-span-1 space-y-6">
                     <Card>
                        <CardHeader>
                           <CardTitle className="font-headline text-xl">توزيع حالات الطلبات</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={chartConfig} className="aspect-square">
                                <PieChart>
                                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                                    <Pie data={orderStatusData} dataKey="value" nameKey="status" innerRadius={50} strokeWidth={5}>
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                </PieChart>
                             </ChartContainer>
                        </CardContent>
                     </Card>
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
                                    <Progress value={progressToNextRank} className="h-1 my-2" />
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
