
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
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, runTransaction, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType, Order, Service, BlogPost } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Link from 'next/link';


const chartConfig = {
  orders: {
    label: 'الطلبات',
    color: 'hsl(var(--primary))',
  },
  charge: {
    label: 'الإنفاق',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

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

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openServiceSelector, setOpenServiceSelector] = useState(false)

  // Queries for services
  const servicesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: allServices, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);

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
        <CardDescription>ابحث عن الخدمة المطلوبة وقدم طلبك مباشرة.</CardDescription>
      </CardHeader>
      <CardContent>
        {servicesLoading ? <QuickOrderFormSkeleton /> : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              
              <div className="grid gap-2">
                 <Label>الخدمة</Label>
                  <Popover open={openServiceSelector} onOpenChange={setOpenServiceSelector}>
                      <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openServiceSelector}
                              className="w-full justify-between"
                              disabled={servicesLoading}
                          >
                              {selectedService
                                  ? `${selectedService.platform} - ${selectedService.category}`
                                  : "ابحث عن خدمة بالاسم أو الرقم..."}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                              <CommandInput placeholder="ابحث عن خدمة..." />
                              <CommandList>
                                  <CommandEmpty>لم يتم العثور على خدمة.</CommandEmpty>
                                  <CommandGroup>
                                      {allServices?.map((s) => (
                                          <CommandItem
                                              key={s.id}
                                              value={`${s.id} ${s.platform} ${s.category}`}
                                              onSelect={() => {
                                                  setSelectedServiceId(s.id)
                                                  setOpenServiceSelector(false)
                                              }}
                                          >
                                            <Check className={cn("ml-2 h-4 w-4", selectedServiceId === s.id ? "opacity-100" : "opacity-0")}/>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{s.platform} - {s.category}</span>
                                                <span className="text-xs text-muted-foreground">ID: {s.id} | ${s.price}/1k</span>
                                            </div>
                                          </CommandItem>
                                      ))}
                                  </CommandGroup>
                              </CommandList>
                          </Command>
                      </PopoverContent>
                  </Popover>
              </div>
              
              {selectedServiceId && (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor="link">الرابط</Label>
                        <Input id="link" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">الكمية</Label>
                        <Input id="quantity" type="number" placeholder="1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                        {selectedService && <p className="text-xs text-muted-foreground">الحدود: {selectedService.min} - ${selectedService.max}</p>}
                    </div>
                    <div className="text-sm font-medium text-center p-2 bg-muted rounded-md">
                        التكلفة التقديرية: <span className="text-primary">${cost.toFixed(2)}</span> (خصم {discountPercentage*100}%)
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'إرسال الطلب'}
                    </Button>
                </>
              )}
            </form>
        )}
      </CardContent>
    </Card>
  );
}


function DealOfTheDay() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settingsData, isLoading: isSettingsLoading } = useDoc<any>(settingsDocRef);
    
    const dealOfTheDayId = settingsData?.dealOfTheDay;

    const serviceDocRef = useMemoFirebase(() => (firestore && dealOfTheDayId) ? doc(firestore, 'services', dealOfTheDayId) : null, [firestore, dealOfTheDayId]);
    const { data: serviceData, isLoading: isServiceLoading } = useDoc<Service>(serviceDocRef);
    
    const isLoading = isSettingsLoading || isServiceLoading;

    if (isLoading) {
        return <Skeleton className="h-28 w-full" />
    }

    if (!dealOfTheDayId || !serviceData) {
        return null; // Don't render if no deal is set or service not found
    }

    return (
        <Card className="bg-gradient-to-tr from-card to-accent border-primary/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary" />
                    <span>صفقة اليوم</span>
                </CardTitle>
                <CardDescription>عرض خاص لفترة محدودة!</CardDescription>
            </CardHeader>
            <CardContent>
                <h3 className="font-bold text-lg">{serviceData.platform} - {serviceData.category}</h3>
                <p className="text-muted-foreground">السعر: <span className="text-primary font-bold">${serviceData.price.toFixed(2)}</span> لكل 1000</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" asChild>
                    <Link href="/dashboard/mass-order">اطلب الآن</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function Announcements() {
    const firestore = useFirestore();
    const postsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'blogPosts'), orderBy('publishDate', 'desc'), limit(3)) : null, [firestore]);
    const { data: posts, isLoading } = useCollection<BlogPost>(postsQuery);

    if (isLoading) {
        return <Skeleton className="h-64 w-full" />
    }

    if (!posts || posts.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>آخر الأخبار والإعلانات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold">{post.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                         <p className="text-xs text-muted-foreground/50 mt-1">{new Date(post.publishDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                ))}
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
    () => (firestore && authUser ? query(collection(firestore, 'users', authUser.uid, 'orders'), orderBy('orderDate', 'desc')) : null),
    [firestore, authUser]
  );
  const { data: ordersData, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const isLoading = isAuthLoading || isUserLoading || isOrdersLoading;
  
  const performanceData = useMemo(() => {
    if (!ordersData) return [];
    const dataByDate: Record<string, { date: string, charge: number, orders: number }> = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dataByDate[dateStr] = { date: dateStr, charge: 0, orders: 0 };
    }

    ordersData.forEach(order => {
        const orderDate = new Date(order.orderDate);
        const dateStr = orderDate.toISOString().split('T')[0];
        if (dataByDate[dateStr]) {
            dataByDate[dateStr].charge += order.charge;
            dataByDate[dateStr].orders += 1;
        }
    });

    return Object.values(dataByDate);
  }, [ordersData]);


  if (isLoading || !userData || !authUser) {
    return (
      <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
          </div>
          <QuickOrderFormSkeleton />
          <Skeleton className="h-[300px]" />
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[250px]" />
        </div>
      </div>
    );
  }
  
  const rank = getRankForSpend(userData?.totalSpent ?? 0);
  
  const achievements = [
    { icon: Rocket, title: "المنطلق الصاروخي", completed: (ordersData?.length || 0) > 0 },
    { icon: Shield, title: "المستخدم الموثوق", completed: (ordersData?.length || 0) >= 10 },
    { icon: ShoppingCart, title: "سيد الطلبات", completed: (ordersData?.length || 0) >= 50 },
    { icon: Star, title: "النجم الصاعد", completed: (userData.totalSpent || 0) >= 100 },
    { icon: DollarSign, title: "ملك الإنفاق", completed: (userData.totalSpent || 0) >= 1000 },
    { icon: Sparkles, title: "العميل المميز", completed: (userData.rank) === 'سيد المجرة' },
    { icon: Diamond, title: "الأسطورة الكونية", completed: (userData.rank) === 'سيد كوني' },
    { icon: Users, title: "المسوق الشبكي", completed: (userData.referralsCount || 0) >= 5 },
  ];
  
  const recentOrders = ordersData?.slice(0, 5);
  const statusVariant = {
    'مكتمل': 'default',
    'قيد التنفيذ': 'secondary',
    'ملغي': 'destructive',
    'جزئي': 'outline',
  } as const;


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        
        <DealOfTheDay />
        <Announcements />

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">أداء الحساب</CardTitle>
                <CardDescription>نظرة عامة على إنفاقك وطلباتك خلال آخر 7 أيام.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={performanceData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis yAxisId="left" orientation="right" stroke="hsl(var(--primary))" hide />
                    <YAxis yAxisId="right" orientation="left" stroke="hsl(var(--accent))" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="var(--color-orders)" radius={4} yAxisId="left" name="الطلبات" />
                    <Bar dataKey="charge" fill="var(--color-charge)" radius={4} yAxisId="right" name="الإنفاق" />
                  </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="font-headline">الطلبات الأخيرة</CardTitle>
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
        <QuickOrderForm user={authUser} userData={userData} />
      </div>
    </div>
  );
}
