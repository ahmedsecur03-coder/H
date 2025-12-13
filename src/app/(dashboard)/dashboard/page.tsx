
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Button } from '@/components/ui/button';
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
  Loader2
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType, Order } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getRankForSpend } from '@/lib/service';
import { claimDailyRewardAndGenerateArticle } from '@/lib/actions';
import Link from 'next/link';
import { QuickOrderForm } from '../_components/quick-order-form';
import { useToast } from '@/hooks/use-toast';


function DashboardSkeleton() {
    return (
      <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className='mb-4'>
                <Skeleton className="h-8 w-1/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
            </div>
             <Skeleton className="h-96" />
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
}

function DailyRewardCard({ user, onClaim }: { user: UserType, onClaim: () => void }) {
    const { toast } = useToast();
    const [isClaiming, setIsClaiming] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    const canClaim = useMemo(() => {
        if (!user.lastRewardClaimedAt) return true;
        const lastClaimedTime = new Date(user.lastRewardClaimedAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return Date.now() - lastClaimedTime > twentyFourHours;
    }, [user.lastRewardClaimedAt]);

    useEffect(() => {
        if (canClaim || !user.lastRewardClaimedAt) return;

        const intervalId = setInterval(() => {
            const lastClaimedTime = new Date(user.lastRewardClaimedAt!).getTime();
            const twentyFourHours = 24 * 60 * 60 * 1000;
            const nextClaimTime = lastClaimedTime + twentyFourHours;
            const now = Date.now();
            const remaining = nextClaimTime - now;

            if (remaining <= 0) {
                setTimeLeft('');
                clearInterval(intervalId);
            } else {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [canClaim, user.lastRewardClaimedAt]);

    const handleClaim = async () => {
        setIsClaiming(true);
        toast({ title: 'جاري طلب المكافأة...', description: 'يقوم الذكاء الاصطناعي بإنشاء المحتوى الآن.' });
        try {
            await claimDailyRewardAndGenerateArticle(user.id);
            toast({ title: '🎉 تم بنجاح!', description: 'تمت إضافة 1$ لرصيد إعلاناتك ونشر مقال جديد في المدونة!' });
            onClaim();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <Card className="bg-gradient-to-br from-secondary/30 to-background">
            <CardHeader>
                <CardTitle className="flex items-center justify-between font-headline">
                    <span>المكافأة الكونية اليومية</span>
                    <Gift className="text-primary"/>
                </CardTitle>
                <CardDescription>
                    اطلب مكافأتك اليومية: 1$ رصيد إعلانات + مقال جديد للمدونة يولده الذكاء الاصطناعي!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full text-lg" onClick={handleClaim} disabled={!canClaim || isClaiming}>
                    {isClaiming ? <Loader2 className="animate-spin" /> : canClaim ? 'اطلب مكافأتك الآن!' : `عد بعد: ${timeLeft}`}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );
  const { data: userData, isLoading: isUserLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

  const ordersQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, 'users', authUser.uid, 'orders'), orderBy('orderDate', 'desc'), limit(5)) : null),
    [firestore, authUser]
  );
  const { data: recentOrders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const isLoading = isAuthLoading || isUserLoading || isOrdersLoading;
  
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
         <DailyRewardCard user={userData} onClaim={forceDocUpdate} />
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
