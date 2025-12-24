
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
  PlusCircle,
  Briefcase,
  ChevronLeft,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, getDoc, getDocs } from 'firebase/firestore';
import type { User as UserType, Order, Service } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getRankForSpend } from '@/lib/service';
import { QuickOrderForm } from './_components/quick-order-form';
import { DailyRewardCard } from './_components/daily-reward-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { NewCampaignDialog } from './campaigns/_components/new-campaign-dialog';


function WelcomeAlert({ name }: { name: string }) {
    return (
        <Alert className="bg-primary/5 border-primary/20">
            <Rocket className="h-4 w-4" />
            <AlertTitle className="font-bold">أهلاً بك في الفضاء الرقمي، {name}!</AlertTitle>
            <AlertDescription>
                أنت جاهز للانطلاق. ابدأ باستكشاف خدماتنا أو قم بشحن رصيدك لبدء رحلتك نحو النمو.
                 <div className="mt-4 flex gap-2">
                    <Button asChild size="sm">
                        <Link href="/services">استكشف الخدمات</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/add-funds">شحن الرصيد</Link>
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}

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
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
                <Skeleton className="h-96" />
                <Skeleton className="h-64" />
            </div>
             <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                 <Skeleton className="h-44 w-full" />
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
    const { data: userData, isLoading: isUserDataLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

    const ordersQuery = useMemoFirebase(() => authUser ? query(collection(firestore, `users/${authUser.uid}/orders`), orderBy('orderDate', 'desc'), limit(5)) : null, [authUser, firestore]);
    const { data: recentOrders, isLoading: areOrdersLoading } = useCollection<Order>(ordersQuery);

    const isLoading = isUserLoading || isUserDataLoading || areOrdersLoading;

    if (isLoading || !userData || !authUser) {
        return <DashboardSkeleton />;
    }
  
    const rank = getRankForSpend(userData?.totalSpent ?? 0);
  
    const achievements = [
        { icon: Rocket, title: "رجل الصواريخ", completed: (recentOrders?.length || 0) > 0 },
        { icon: Shield, title: "مستخدم موثوق", completed: (recentOrders?.length || 0) >= 10 },
        { icon: ShoppingCart, title: "سيد الطلبات", completed: (recentOrders?.length || 0) >= 50 },
        { icon: Star, title: "نجم صاعد", completed: (userData.totalSpent || 0) >= 100 },
        { icon: DollarSign, title: "ملك الإنفاق", completed: (userData.totalSpent || 0) >= 1000 },
        { icon: Sparkles, title: "عميل مميز", completed: (userData.rank) === 'سيد المجرة' },
        { icon: Diamond, title: "أسطورة كونية", completed: (userData.rank) === 'سيد كوني' },
        { icon: Users, title: "اجتماعي", completed: (userData.referralsCount || 0) >= 5 },
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
                    <h1 className='text-3xl font-bold font-headline'>مرحباً بعودتك، {userData?.name || 'Hagaaty'}!</h1>
                    <p className='text-muted-foreground'>هذه هي لوحة التحكم الخاصة بك. كل شيء تحت السيطرة.</p>
                </div>
            
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
                         <CardHeader className="pb-2 flex-row items-center justify-between">
                            <CardDescription>رصيد الإعلانات</CardDescription>
                             <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">${(userData?.adBalance ?? 0).toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2 flex-row items-center justify-between">
                            <CardDescription>إجمالي الإنفاق</CardDescription>
                             <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">${(userData?.totalSpent ?? 0).toFixed(2)}</div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NewCampaignDialog userData={userData} onCampaignCreated={forceDocUpdate}>
                        <Button className="w-full text-lg py-7">
                            <PlusCircle className="ml-2 h-5 w-5" />
                            إنشاء حملة جديدة
                        </Button>
                    </NewCampaignDialog>
                    <Button variant="outline" className="w-full text-lg py-7" asChild>
                        <Link href="/dashboard/agency-accounts">
                            <Briefcase className="ml-2 h-5 w-5" />
                            إدارة حسابات الوكالة
                        </Link>
                    </Button>
                </div>

                {(recentOrders && recentOrders.length > 0) ? (
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
                                    {recentOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.serviceName}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : (
                    <WelcomeAlert name={userData?.name || 'User'} />
                )}
            </div>

            <div className="grid auto-rows-max items-start gap-4 md:gap-8">
                <QuickOrderForm user={authUser} userData={userData} />
                <DealOfTheDay />
                <DailyRewardCard user={userData} onClaim={forceDocUpdate} />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>الإنجازات</span>
                            <Trophy className="text-primary"/>
                        </CardTitle>
                        <CardDescription>أكملت {achievements.filter(a => a.completed).length} من أصل {achievements.length} إنجازات</CardDescription>
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
