
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Gem,
  Percent,
  Loader2,
  Users,
  Trophy,
  Rocket,
  Shield,
  Star,
  Sparkles,
  Diamond,
  Megaphone,
  BookOpen,
  ArrowLeft,
  Check,
  Zap,
  Palette,
  Briefcase,
  Gamepad2,
  MapPin,
  Clapperboard,
  Bot
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType, Order, Service, BlogPost } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { PLATFORM_ICONS } from '@/lib/icon-data';

const RANKS: { name: UserType['rank']; spend: number; discount: number, reward: number }[] = [
  { name: 'مستكشف نجمي', spend: 0, discount: 0, reward: 0 },
  { name: 'قائد صاروخي', spend: 500, discount: 2, reward: 5 },
  { name: 'سيد المجرة', spend: 2500, discount: 5, reward: 20 },
  { name: 'سيد كوني', spend: 10000, discount: 10, reward: 50 },
];

function getRankForSpend(spend: number) {
  let currentRank = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (spend >= RANKS[i].spend) {
      currentRank = RANKS[i];
      break;
    }
  }
  return currentRank;
}

const serviceCategories = [
    { label: "انستغرام", icon: PLATFORM_ICONS.Instagram},
    { label: "خدمات الوكالة", icon: Briefcase},
    { label: "تصميم المواقع", icon: Palette},
    { label: "الحملات الإعلانية", icon: Megaphone},
    { label: "سناب شات", icon: PLATFORM_ICONS.Snapchat},
    { label: "كواي", icon: Clapperboard},
    { label: "واتساب", icon: PLATFORM_ICONS.Whatsapp},
    { label: "خدمات الألعاب", icon: Gamepad2},
    { label: "تيك توك", icon: PLATFORM_ICONS.TikTok},
    { label: "فيسبوك", icon: PLATFORM_ICONS.Facebook},
    { label: "خرائط جوجل", icon: MapPin},
    { label: "يوتيوب", icon: PLATFORM_ICONS.YouTube},
    { label: "تيليجرام", icon: PLATFORM_ICONS.Telegram},
    { label: "اكس (تويتر)", icon: PLATFORM_ICONS['X (Twitter)']},
    { label: "كلوب هاوس", icon: Users},
    { label: "زيارات مواقع", icon: Rocket},
];


function QuickOrderFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
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
  const { data: userData, isLoading: isUserLoading } = useDoc<UserType>(userDocRef);

  const ordersQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, 'users', authUser.uid, 'orders'), orderBy('orderDate', 'desc'), limit(5)) : null),
    [firestore, authUser]
  );
  const { data: recentOrders, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const isLoading = isAuthLoading || isUserLoading || isOrdersLoading;
  
  if (isLoading || !userData || !authUser) {
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
             <QuickOrderFormSkeleton />
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
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
    <div className="pb-4">
            <div className='mb-8'>
                <h1 className='text-3xl font-bold font-headline'>أهلاً بك، {userData?.name || 'Hagaaty'}!</h1>
                <p className='text-muted-foreground'>هنا ملخص سريع لحسابك. انطلق واستكشف خدماتنا.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <CardTitle className="text-2xl text-primary">{rank.name}</CardTitle>
                        <CardDescription>خصم {rank.discount}%</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>تقديم طلب جديد</CardTitle>
                            <CardDescription>اختر المنصة، ثم الفئة، ثم الخدمة لبدء طلبك.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex flex-wrap gap-2 mb-4">
                                {serviceCategories.map(({label, icon: Icon}) => (
                                    <Button variant="outline" key={label} className="flex-grow">
                                        <Icon className="ml-2 h-4 w-4"/>
                                        {label}
                                    </Button>
                                ))}
                            </div>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر خدمة..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">4216 - متابعين إنستغرام |🔥حسابات قديمة + منشورات |⚡السرعة 100 ألف/اليوم |⛔بدون ضمان - $0.6091 لكل 1000</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
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
                 <div className="space-y-6">
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
    </div>
  );
}
