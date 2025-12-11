
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
import type { User as UserType, Order, Service } from '@/lib/types';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


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

const servicePlatforms = [
    { name: "انستغرام", icon: Users },
    { name: "تيك توك", icon: Users },
    { name: "فيسبوك", icon: Users },
    { name: "يوتيوب", icon: Users },
    { name: "تليجرام", icon: Users },
    { name: "إكس (تويتر)", icon: Users },
    { name: "سناب شات", icon: Users },
    { name: "كواي", icon: Users },
    { name: "VK", icon: Users },
    { name: "Kick", icon: Users },
    { name: "كلوب هاوس", icon: Users },
    { name: "زيارات مواقع", icon: Users },
];


function QuickOrderForm({ user, userData }: { user: any, userData: UserType }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false)

  // Queries for services
  const servicesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: allServices, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);

  const { categories, servicesForCategory, selectedService } = useMemo(() => {
    if (!allServices) return { categories: [], servicesForCategory: [], selectedService: null };
    
    const platformServices = allServices.filter(s => s.platform === selectedPlatform);
    const categories = selectedPlatform ? [...new Set(platformServices.map(s => s.category))] : [];
    
    const servicesForCategory = selectedCategory ? platformServices.filter(s => s.category === selectedCategory) : [];

    const selectedService = selectedServiceId ? allServices.find(s => s.id === selectedServiceId) : null;
    return { categories, servicesForCategory, selectedService };
  }, [allServices, selectedPlatform, selectedCategory, selectedServiceId]);
  
  const rank = getRankForSpend(userData?.totalSpent ?? 0);
  const discountPercentage = rank.discount / 100;

  // Calculate cost
  useMemo(() => {
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
        const userDocRef = doc(firestore, "users", user.uid);

        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");
            
            const currentData = userDoc.data() as UserType;
            const currentBalance = currentData.balance;
            const currentRankInfo = getRankForSpend(currentData.totalSpent);

            if (currentBalance < cost) throw new Error("رصيدك غير كافٍ.");

            const newBalance = currentBalance - cost;
            const newTotalSpent = currentData.totalSpent + cost;
            const newRankInfo = getRankForSpend(newTotalSpent);
            
            const updates: Partial<UserType> = {
                balance: newBalance,
                totalSpent: newTotalSpent,
            };

            let promotionToast: { title: string; description: string } | null = null;


            if (newRankInfo.name !== currentRankInfo.name) {
                updates.rank = newRankInfo.name;
                // Only add reward if there is one
                if (newRankInfo.reward > 0) {
                    updates.adBalance = (currentData.adBalance || 0) + newRankInfo.reward;
                    promotionToast = {
                        title: `🎉 ترقية! أهلاً بك في رتبة ${newRankInfo.name}`,
                        description: `لقد حصلت على مكافأة ${newRankInfo.reward}$ في رصيد إعلاناتك!`,
                    };
                }
            }

            transaction.update(userDocRef, updates);

            const newOrderRef = doc(collection(firestore, `users/${user.uid}/orders`));
            const newOrder: Omit<Order, 'id'> = {
                userId: user.uid,
                serviceId: selectedService.id,
                serviceName: `${selectedService.category} (${selectedService.platform})`,
                link: link,
                quantity: numQuantity,
                charge: cost,
                orderDate: new Date().toISOString(),
                status: 'قيد التنفيذ',
            };
            transaction.set(newOrderRef, newOrder);
            return promotionToast;
        }).then((promotionToast) => {
            toast({ title: "تم إرسال الطلب بنجاح!", description: `التكلفة: $${cost.toFixed(2)}` });
            if(promotionToast) {
                 setTimeout(() => toast(promotionToast), 1000);
            }
        });

        
        // Reset form
        setSelectedPlatform(undefined);
        setSelectedCategory(undefined);
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
        {servicesLoading ? <Skeleton className="h-96 w-full" /> : (
            <form onSubmit={handleSubmit} className="grid gap-4">
              
              <div className="grid gap-2">
                <Label>المنصة</Label>
                <div className='flex flex-wrap gap-2'>
                    {servicePlatforms.map(p => (
                        <Button key={p.name} type="button" variant={selectedPlatform === p.name ? "default" : "outline"} className="flex-grow" onClick={() => {setSelectedPlatform(p.name); setSelectedCategory(undefined); setSelectedServiceId(undefined);}}>
                            {/* <p.icon className="ml-2" /> */}
                            {p.name}
                        </Button>
                    ))}
                </div>
              </div>

              {selectedPlatform && (
                <div className="grid gap-2">
                    <Label htmlFor="category">الفئة</Label>
                    <Select onValueChange={(value) => { setSelectedCategory(value); setSelectedServiceId(undefined); }} value={selectedCategory} disabled={!selectedPlatform || categories.length === 0}>
                    <SelectTrigger id="category"><SelectValue placeholder={categories.length > 0 ? "اختر فئة" : "لا توجد فئات لهذه المنصة"} /></SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
              )}
              
              {selectedCategory && (
                <div className="grid gap-2">
                    <Label htmlFor="service">الخدمة</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between"
                                disabled={!selectedCategory || servicesForCategory.length === 0}
                            >
                                {selectedService
                                    ? `${selectedService.id} - ${selectedService.category}`
                                    : "اختر خدمة..."}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="ابحث عن خدمة..." />
                                <CommandList>
                                    <CommandEmpty>لم يتم العثور على خدمة.</CommandEmpty>
                                    <CommandGroup>
                                        {servicesForCategory.map((s) => (
                                            <CommandItem
                                                key={s.id}
                                                value={s.id}
                                                onSelect={(currentValue) => {
                                                    setSelectedServiceId(currentValue === selectedServiceId ? "" : currentValue)
                                                    setOpen(false)
                                                }}
                                            >
                                                {s.id} - {s.category} (${s.price}/1k)
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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

  const recentOrders = ordersData?.slice(0, 5);
  const statusVariant = {
    مكتمل: 'default',
    'قيد التنفيذ': 'secondary',
    ملغي: 'destructive',
    جزئي: 'outline',
  } as const;


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>إجمالي الإنفاق</span>
                 <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(userData?.totalSpent ?? 0).toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>الرتبة الكونية</span>
                <Gem className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData?.rank ?? '...'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>خصم الخدمات</span>
                 <Percent className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rank.discount}%</div>
            </CardContent>
          </Card>
        </div>
        
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
                <CardTitle>الإنجازات الكونية</CardTitle>
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
