
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
  DollarSign,
  Loader2,
  Users,
  Trophy,
  Rocket,
  Shield,
  Star,
  Sparkles,
  Diamond,
  Check,
  ShoppingCart,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, runTransaction } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType, Order, Service } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getRankForSpend, RANKS, AFFILIATE_LEVELS } from '@/lib/service';

function QuickOrderForm({ user, userData }: { user: any, userData: UserType }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openServiceSelector, setOpenServiceSelector] = useState(false)

  const servicesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: allServices, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);

  const selectedService = useMemo(() => {
    return selectedServiceId ? allServices?.find(s => s.id === selectedServiceId) : null;
  }, [allServices, selectedServiceId]);
  
  const rank = getRankForSpend(userData?.totalSpent ?? 0);
  const discountPercentage = rank.discount / 100;

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
                        level: 1 
                    });
                }
            }
        });

        toast({ title: "تم إرسال الطلب بنجاح!", description: `التكلفة: $${cost.toFixed(2)}` });
        if(promotionToast) {
            setTimeout(() => toast(promotionToast), 1000);
        }

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
      </CardHeader>
      <CardContent>
        {servicesLoading ? <QuickOrderFormSkeleton /> : (
            <form onSubmit={handleSubmit} className="grid gap-6">
              
              <div className="grid gap-2">
                 <Label>الخدمة</Label>
                  <Popover open={openServiceSelector} onOpenChange={setOpenServiceSelector}>
                      <PopoverTrigger asChild>
                          <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openServiceSelector}
                              className="w-full justify-between h-auto"
                              disabled={servicesLoading}
                          >
                            <div className="flex flex-col text-right items-start">
                              {selectedService
                                  ? <>
                                      <span className='font-bold'>{selectedService.platform} - {selectedService.category}</span>
                                      <span className='text-xs text-muted-foreground'>${selectedService.price}/1k</span>
                                    </>
                                  : "ابحث عن خدمة بالاسم أو الرقم..."}
                            </div>
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
                                                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                                                    <span>ID: {s.id}</span>
                                                    <span className='font-bold text-primary'>${s.price}/1k</span>
                                                    {s.speed && <span>⚡️{s.speed}</span>}
                                                    {s.guarantee && <span>⛔️ضمان</span>}
                                                </div>
                                            </div>
                                          </CommandItem>
                                      ))}
                                  </CommandGroup>
                              </CommandList>
                          </Command>
                      </PopoverContent>
                  </Popover>
              </div>

              {selectedService && (
                <>
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-lg">وصف الخدمة</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <p>⏱️ <span className="font-semibold">البدء:</span> {selectedService.startTime || 'غير محدد'}</p>
                                <p>⚡️ <span className="font-semibold">السرعة:</span> {selectedService.speed || 'غير محدد'}</p>
                                <p>🔴 <span className="font-semibold">السقوط:</span> {selectedService.dropRate || 'غير محدد'}</p>
                                <p>🟢 <span className="font-semibold">الضمان:</span> {selectedService.guarantee ? 'متوفر' : 'بدون ضمان'}</p>
                            </div>
                            <Alert variant="destructive" className="bg-destructive/10 text-destructive-foreground border-destructive/20">
                                <AlertTitle className="flex items-center gap-2">🚨 تنبيه</AlertTitle>
                                <AlertDescription>
                                تأكد من تقديم طلبك بعناية قبل إرساله، حيث قد لا يكون الإلغاء بعد ذلك ممكنًا في بعض الأحيان.
                                </AlertDescription>
                            </Alert>
                            <div>
                                <h4 className="font-semibold mb-2">تفاصيل:</h4>
                                <ul className="list-inside list-disc space-y-1 text-muted-foreground text-xs">
                                   {selectedService.description?.split('\\n').map((line, i) => <li key={i}>{line}</li>)}
                                    <li>إذا تم تغيير اسم الحساب، يعتبر الطلب مكتملاً.</li>
                                    <li>تأكد من صحة الرابط قبل الطلب. إذا أدخلت رابطًا غير صحيح، فلن يكون هناك استرداد للمبلغ.</li>
                                    <li>لا تطلب من مصدر آخر أثناء عملنا على طلبك.</li>
                                    <li>تأكد من أن الحساب عام قبل إنشاء الطلب.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-2">
                        <Label htmlFor="link">الرابط</Label>
                        <Input id="link" placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="quantity">الكمية (الحد الأدنى: {selectedService.min} - الحد الأقصى: {selectedService.max})</Label>
                        <Input id="quantity" type="number" placeholder="1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} required min={selectedService.min} max={selectedService.max}/>
                    </div>

                    <div className="text-sm font-medium text-center p-3 bg-muted rounded-md space-y-1">
                         <div className="flex justify-between">
                            <span>متوسط الوقت:</span>
                            <span>{selectedService.avgTime || 'غير محدد'}</span>
                         </div>
                         <div className="flex justify-between text-lg text-primary">
                            <span className="font-bold">السعر:</span>
                            <span className="font-bold">${cost.toFixed(4)}</span>
                         </div>
                         <p className="text-xs text-muted-foreground">(خصم {discountPercentage*100}%)</p>
                    </div>

                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'شراء الخدمة'}
                    </Button>
                </>
              )}
            </form>
        )}
      </CardContent>
    </Card>
  );
}


function QuickOrderFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
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
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className='mb-4'>
                <h1 className='text-3xl font-bold font-headline'>أهلاً بك، {userData?.name || 'Hagaaty'}!</h1>
                <p className='text-muted-foreground'>هنا ملخص سريع لحسابك. انطلق واستكشف خدماتنا.</p>
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

      <div className="grid auto-rows-max items-start gap-4 md:gap-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
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
                </CardHeader>
            </Card>
        </div>
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
