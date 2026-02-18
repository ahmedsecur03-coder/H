
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
  Star,
  ShoppingCart,
  ListOrdered,
  Archive,
  ArrowUpRight,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { User as UserType, Order } from '@/lib/types';
import { getRankForSpend, RANKS } from '@/lib/service';
import { QuickOrderForm } from './_components/quick-order-form';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { DailyRewardCard } from './_components/daily-reward-card';


function DashboardSkeleton() {
    return (
        <div className="space-y-6">
             <div className='mb-4'>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-[500px]" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                     <Skeleton className="h-64" />
                     <Skeleton className="h-[400px]" />
                </div>
            </div>
        </div>
    );
}

const chartConfig = {
  charge: { label: 'التكلفة', color: 'hsl(var(--primary))' },
};

export default function DashboardPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userData, isLoading: isUserDataLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

    const ordersQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/orders`), orderBy('orderDate', 'desc')) : null, [authUser, firestore]);
    const { data: allOrders, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

    const isLoading = isUserLoading || isUserDataLoading || areOrdersLoading;
    
    const { recentOrders, performanceData } = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const performanceDataMap = new Map(last7Days.map(date => [date, { date, charge: 0 }]));

        if (allOrders) {
            allOrders.forEach(order => {
                const orderDate = order.orderDate.split('T')[0];
                if (performanceDataMap.has(orderDate)) {
                    performanceDataMap.get(orderDate)!.charge += order.charge;
                }
            });
        }
        
        return {
            recentOrders: allOrders?.slice(0, 5) || [],
            performanceData: Array.from(performanceDataMap.values()),
        };

    }, [allOrders]);


    if (isLoading || !userData || !authUser) {
        return <DashboardSkeleton />;
    }
  
    const rank = getRankForSpend(userData?.totalSpent ?? 0);
    const currentRankIndex = RANKS.findIndex(r => r.name === rank.name);
    const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;

    const progressToNextRank = nextRank ? ((userData.totalSpent - rank.spend) / (nextRank.spend - rank.spend)) * 100 : 100;
    const amountToNextRank = nextRank ? nextRank.spend - userData.totalSpent : 0;

    const statusVariant = {
        'مكتمل': 'default',
        'قيد التنفيذ': 'secondary',
        'ملغي': 'destructive',
        'جزئي': 'outline'
    } as const;

    return (
        <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className='mb-4'>
                <h1 className='text-xl md:text-3xl font-bold font-headline'>أهلاً بك، {userData?.name}!</h1>
                <p className='text-muted-foreground'>نمو حساباتك يبدأ من هنا. اطلب خدمات الـ SMM الآن.</p>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                <div className="lg:col-span-2">
                    <QuickOrderForm user={authUser} userData={userData} />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-primary/10 shadow-sm">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">مستوى العضوية</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                             <rank.icon className="h-16 w-16 text-primary mx-auto" />
                             <h3 className="text-2xl font-bold mt-2">{rank.name}</h3>
                             <p className="text-sm text-primary font-medium">خصم {rank.discount}% حصري</p>
                             {nextRank && (
                                <div className="mt-4 text-xs">
                                     <Progress value={progressToNextRank} className="h-1.5" />
                                    <p className="mt-2 text-muted-foreground">أنفق <span className="font-bold text-foreground">${amountToNextRank.toFixed(2)}</span> للوصول لرتبة {nextRank.name}!</p>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                    <DailyRewardCard user={userData} onClaim={forceDocUpdate} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                 <Card>
                         <CardHeader>
                            <CardTitle className="font-headline text-xl">نشاط الإنفاق (آخر 7 أيام)</CardTitle>
                            <CardDescription>متابعة حجم استثماراتك في خدمات SMM.</CardDescription>
                         </CardHeader>
                         <CardContent>
                            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={performanceData}>
                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} />
                                        <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" hide />
                                        <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                                        <Bar dataKey="charge" fill="var(--color-charge)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                         </CardContent>
                    </Card>
                 <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-headline text-xl">أحدث الطلبات</CardTitle>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard/orders">
                                    عرض الكل
                                    <ArrowUpRight className="mr-2 h-4 w-4" />
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
                                                    <TableCell className="font-medium max-w-[150px] truncate">{order.serviceName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">${order.charge.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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
        </motion.div>
    );
}
