
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Users,
  Trophy,
  Rocket,
  Shield,
  Star,
  Sparkles,
  Diamond,
  ShoppingCart,
  Gift,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, getDoc, getDocs } from 'firebase/firestore';
import type { User as UserType, Order } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getRankForSpend } from '@/lib/service';
import { QuickOrderForm } from './_components/quick-order-form';
import { DailyRewardCard } from './_components/daily-reward-card';
import { Skeleton } from '@/components/ui/skeleton';


function DashboardSkeleton() {
    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                <div className='mb-4'>
                    <Skeleton className="h-9 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
                <Skeleton className="h-96" />
                <Skeleton className="h-64" />
            </div>
             <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <Skeleton className="h-40" />
                <Skeleton className="h-64" />
             </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserType>(userDocRef);

    const ordersQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/orders`), orderBy('orderDate', 'desc'), limit(5)) : null, [authUser, firestore]);
    const { data: recentOrders, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

    const isLoading = isUserLoading || isUserDataLoading || areOrdersLoading;

    if (isLoading || !userData || !authUser) {
        return <DashboardSkeleton />;
    }
  
    const rank = getRankForSpend(userData?.totalSpent ?? 0);
  
    const achievements = [
        { icon: Rocket, title: "المنطلق الصاروخي", completed: (recentOrders?.length || 0) > 0 },
        { icon: Shield, title: "المستخدم الموثوق", completed: (recentOrders?.length || 0) >= 10 },
        { icon: ShoppingCart, title: "سيد الطلبات", completed: (recentOrders?.length || 0) >= 50 },
        { icon: Star, title: "النجم الصاعد", completed: (userData.totalSpent || 0) >= 100 },
        { icon: DollarSign, title: "ملك الإنفاق", completed: (userData.totalSpent || 0) >= 1000 },
        { icon: Sparkles, title: "العميل المميز", completed: (userData.rank) === 'سيد المجرة' },
        { icon: Diamond, title: "الأسطورة الكونية", completed: (userData.rank) === 'سيد كوني' },
        { icon: Users, title: "المسوق الشبكي", completed: (userData.referralsCount || 0) >= 5 },
    ];
  
    const statusVariant = {
        'مكتمل': 'default',
        'قيد التنفيذ': 'secondary',
        'ملغي': 'destructive',
        'جزئي': 'outline',
    } as const;


    return (
        <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                <div className='mb-4'>
                    <h1 className='text-3xl font-bold font-headline'>أهلاً بك، {userData?.name || 'Hagaaty'}!</h1>
                    <p className='text-muted-foreground'>هنا ملخص سريع لحسابك. انطلق واستكشف خدماتنا.</p>
                </div>
            
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>الرصيد الأساسي</CardDescription>
                            <CardTitle className="text-3xl">${(userData?.balance ?? 0).toFixed(2)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>الرصيد الإعلاني</CardDescription>
                            <CardTitle className="text-3xl">${(userData?.adBalance ?? 0).toFixed(2)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>إجمالي الإنفاق</CardDescription>
                            <CardTitle className="text-3xl">${(userData?.totalSpent ?? 0).toFixed(2)}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>رتبتك الكونية</CardDescription>
                            <CardTitle className="text-xl text-primary">{rank.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">خصم {rank.discount}%</p>
                        </CardHeader>
                    </Card>
                </div>

                <QuickOrderForm user={authUser} userData={userData} />

                <Card>
                <CardHeader>
                    <CardTitle className="font-headline">آخر 5 طلبات</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>الخدمة</TableHead>
                        <TableHead>الحالة</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentOrders && recentOrders.length > 0 ? (
                        recentOrders.map((order) => (
                            <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.serviceName}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                            لا توجد طلبات لعرضها.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
                </Card>
            </div>

            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <DailyRewardCard user={userData} />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>الإنجازات الكونية</span>
                            <Trophy className="text-primary"/>
                        </CardTitle>
                        <CardDescription>أكملت {achievements.filter(a => a.completed).length} من {achievements.length} إنجازات</CardDescription>
                    </CardHeader>
                    <CardContent className='grid grid-cols-4 gap-4'>
                        {achievements.map((ach, i) => (
                            <TooltipProvider key={i}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            'flex flex-col items-center justify-center gap-1 p-2 rounded-lg aspect-square border-2 transition-all',
                                            ach.completed ? 'border-primary/50 bg-primary/20 text-primary' : 'border-transparent bg-muted text-muted-foreground'
                                        )}>
                                            <ach.icon className="h-6 w-6" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{ach.title}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
