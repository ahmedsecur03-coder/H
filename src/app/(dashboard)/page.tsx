
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { doc, collection, query, orderBy, limit, runTransaction, where, addDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType, Order, Service, BlogPost } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';

const RANKS: { name: UserType['rank']; spend: number; discount: number, reward: number }[] = [
  { name: 'مستكشف نجمي', spend: 0, discount: 0, reward: 0 },
  { name: 'قائد صاروخي', spend: 500, discount: 2, reward: 5 },
  { name: 'سيد المجرة', spend: 2500, discount: 5, reward: 20 },
  { name: 'سيد كوني', spend: 10000, discount: 10, reward: 50 },
];

const AFFILIATE_LEVELS = {
    'برونزي': { commission: 10 },
    'فضي': { commission: 12 },
    'ذهبي': { commission: 15 },
    'ماسي': { commission: 20 },
};


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


function QuickOrderForm({ user, userData }: { user: any, userData: UserType }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>();
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries for services
  const servicesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: allServices, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);
  
  const platforms = useMemo(() => {
      if (!allServices) return [];
      const platformSet = new Set(allServices.map(s => s.platform));
      return Array.from(platformSet);
  }, [allServices]);

  const servicesForPlatform = useMemo(() => {
      if (!selectedPlatform || !allServices) return [];
      return allServices.filter(s => s.platform === selectedPlatform);
  }, [selectedPlatform, allServices]);

  const selectedService = useMemo(() => {
    return selectedServiceId ? allServices?.find(s => s.id === selectedServiceId) : null;
  }, [allServices, selectedServiceId]);
  
  const rank = getRankForSpend(userData?.totalSpent ?? 0);
  const discountPercentage = rank.discount / 100;

  // Calculate cost
  useEffect(() => {
    if (selectedService && quantity) {
      const numQuantity = parseInt(quantity, 10);
      if (!isNaN(numQuantity)) {
        const baseCost = (numQuantity / 1000) * selectedService.price;
        const discount = baseCost * discountPercentage;
        setCost(baseCost - discount);
      }
    } else {
      setCost(0);
    }
  }, [selectedService, quantity, discountPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !selectedService || !link || !quantity) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى ملء جميع الحقول." });
      return;
    }
    
    const numQuantity = parseInt(quantity, 10);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast({ variant: "destructive", title: "خطأ", description: "الكمية يجب أن تكون رقماً صحيحاً." });
      return;
    }

    if (numQuantity < selectedService.min || numQuantity > selectedService.max) {
       toast({ variant: "destructive", title: "خطأ", description: `الكمية خارج الحدود المسموحة (${selectedService.min} - ${selectedService.max}).` });
      return;
    }

    if (userData.balance < cost) {
      toast({ variant: "destructive", title: "خطأ", description: "رصيدك غير كافٍ لإتمام هذا الطلب." });
      return;
    }

    setIsSubmitting(true);

    try {
        let promotionToast: { title: string; description: string } | null = null;
        await runTransaction(firestore, async (transaction) => {
            const userDocRef = doc(firestore, "users", user.uid);
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");
            
            const currentData = userDoc.data() as UserType;
            const currentBalance = currentData.balance;

            if (currentBalance < cost) throw new Error("رصيدك غير كافٍ.");

            const newBalance = currentBalance - cost;
            const newTotalSpent = currentData.totalSpent + cost;
            const oldRank = getRankForSpend(currentData.totalSpent);
            const newRank = getRankForSpend(newTotalSpent);
            
            const updates: Partial<UserType> = {
                balance: newBalance,
                totalSpent: newTotalSpent,
            };

            if (newRank.name !== oldRank.name) {
                updates.rank = newRank.name;
                if (newRank.reward > 0) {
                    updates.adBalance = (currentData.adBalance || 0) + newRank.reward;
                    promotionToast = {
                        title: `🎉 ترقية! أهلاً بك في رتبة ${newRank.name}`,
                        description: `لقد حصلت على مكافأة ${newRank.reward}$ في رصيد إعلاناتك!`,
                    };
                }
            }

            transaction.update(userDocRef, updates);

            const newOrderRef = doc(collection(firestore, `users/${user.uid}/orders`));
            const newOrder: Omit<Order, 'id'> = {
                userId: user.uid,
                serviceId: selectedService.id,
                serviceName: `${selectedService.platform} - ${selectedService.category}`,
                link: link,
                quantity: numQuantity,
                charge: cost,
                orderDate: new Date().toISOString(),
                status: 'قيد التنفيذ',
            };
            transaction.set(newOrderRef, newOrder);

             // Affiliate Commission Logic
            if (currentData.referrerId) {
                const referrerRef = doc(firestore, 'users', currentData.referrerId);
                const referrerDoc = await transaction.get(referrerRef);
                if (referrerDoc.exists()) {
                    const referrerData = referrerDoc.data() as UserType;
                    const affiliateLevel = referrerData.affiliateLevel || 'برونزي';
                    const commissionRate = (AFFILIATE_LEVELS[affiliateLevel as keyof typeof AFFILIATE_LEVELS]?.commission || 10) / 100;
                    const commissionAmount = cost * commissionRate;

                    transaction.update(referrerRef, {
                        affiliateEarnings: (referrerData.affiliateEarnings || 0) + commissionAmount
                    });

                    const newTransactionRef = doc(collection(firestore, `users/${referrerData.id}/affiliateTransactions`));
                    transaction.set(newTransactionRef, {
                        userId: referrerData.id,
                        referralId: user.uid,
                        orderId: newOrderRef.id,
                        amount: commissionAmount,
                        transactionDate: new Date().toISOString(),
                        level: 1 // Assuming direct referral for now
                    });
                }
            }
        });

        toast({ title: "تم إرسال الطلب بنجاح!", description: `التكلفة: $${cost.toFixed(2)}` });
        if(promotionToast) {
            setTimeout(() => toast(promotionToast), 1000);
        }

        // Reset form
        setSelectedPlatform(undefined);
        setSelectedServiceId(undefined);
        setLink('');
        setQuantity('');
        setCost(0);
    } catch (error: any) {
        console.error("Order submission error:", error);
        toast({ variant: "destructive", title: "فشل إرسال الطلب", description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">تقديم طلب جديد</CardTitle>
        <CardDescription>اختر المنصة، ثم الفئة، ثم الخدمة لبدء طلبك.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
            <div className='flex items-center gap-2 overflow-x-auto pb-2'>
                 {platforms.map(p => {
                    return (
                        <Button key={p} type="button" variant={selectedPlatform === p ? 'default' : 'outline'} onClick={() => setSelectedPlatform(p)} className="flex items-center gap-2 shrink-0">
                           <span>{p}</span>
                        </Button>
                    )
                 })}
            </div>

            {selectedPlatform && (
                <div className="grid gap-2">
                    <Label htmlFor="service">الخدمة</Label>
                    <Select onValueChange={setSelectedServiceId} value={selectedServiceId}>
                    <SelectTrigger id="service">
                        <SelectValue placeholder="اختر الخدمة المطلوبة" />
                    </SelectTrigger>
                    <SelectContent>
                        {servicesForPlatform.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                            {s.category} - ${s.price}/1k
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
            )}
              
              {selectedServiceId && (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="link">الرابط</Label>
                        <Input id="link" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">الكمية</Label>
                        <Input id="quantity" type="number" placeholder="1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                        {selectedService && <p className="text-xs text-muted-foreground">الحدود: {selectedService.min} - {selectedService.max}</p>}
                    </div>
                    <div className="text-sm font-medium text-center p-2 bg-muted rounded-md">
                        التكلفة التقديرية: <span className="text-primary">${cost.toFixed(2)}</span> (خصم {discountPercentage}%)
                    </div>
                    <Button type="submit" className="w-full bg-primary/90 hover:bg-primary text-primary-foreground" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'شراء الخدمة'}
                    </Button>
                </>
              )}
        </form>
      </CardContent>
    </Card>
  );
}


function QuickOrderFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className='flex items-center gap-2'>
                        {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-10 w-24" />)}
                    </div>
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
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className='mb-4'>
                <h1 className='text-3xl font-bold'>أهلاً بك، {userData?.name || 'Hagaaty'}!</h1>
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
                        <CardTitle className="text-3xl text-primary">{rank.name}</CardTitle>
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
                  <TableHead className="text-left">التكلفة</TableHead>
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
                      <TableCell className="text-left">${order.charge.toFixed(2)}</TableCell>
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

      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
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
