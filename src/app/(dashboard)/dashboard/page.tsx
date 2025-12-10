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
import { performanceData } from '@/lib/placeholder-data';
import { DollarSign, Package, ShoppingCart, Gem } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit, runTransaction, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { User as UserType, Order, Service } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const chartConfig = {
  orders: {
    label: 'الطلبات',
    color: 'hsl(var(--primary))',
  },
  spend: {
    label: 'الإنفاق',
    color: 'hsl(var(--accent))',
  },
} satisfies ChartConfig;

// Quick Order Form Component
function QuickOrderForm({ user, userData }: { user: any; userData: UserType | null }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');

  // Fetch all services
  const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
  const { data: servicesData, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);

  // Memoize categories and services
  const { categories, servicesByCategory } = useMemo(() => {
    if (!servicesData) return { categories: [], servicesByCategory: {} };
    const cats = [...new Set(servicesData.map(s => s.category))];
    const servicesByCat: { [key: string]: Service[] } = {};
    for (const service of servicesData) {
      if (!servicesByCat[service.category]) {
        servicesByCat[service.category] = [];
      }
      servicesByCat[service.category].push(service);
    }
    return { categories: cats, servicesByCategory: servicesByCat };
  }, [servicesData]);

  const selectedService = useMemo(() => {
    return servicesData?.find(s => s.id === selectedServiceId) || null;
  }, [selectedServiceId, servicesData]);
  
  const estimatedCost = useMemo(() => {
    if (selectedService && quantity) {
      return (Number(quantity) / 1000) * selectedService.price;
    }
    return 0;
  }, [selectedService, quantity]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedServiceId(null); // Reset service selection
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !userData || !selectedService || !link || !quantity) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول.' });
      return;
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الكمية يجب أن تكون رقماً أكبر من صفر.' });
      return;
    }

    if (numQuantity < selectedService.min || numQuantity > selectedService.max) {
      toast({ variant: 'destructive', title: 'خطأ', description: `الكمية يجب أن تكون بين ${selectedService.min} و ${selectedService.max}.` });
      return;
    }

    if (userData.balance < estimatedCost) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'رصيدك غير كافٍ لإتمام هذا الطلب.' });
      return;
    }

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const ordersRef = collection(firestore, 'users', user.uid, 'orders');

      // Use a transaction to ensure atomicity
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw "المستخدم غير موجود!";
        }

        const currentBalance = userDoc.data().balance;
        const currentTotalSpent = userDoc.data().totalSpent;

        if (currentBalance < estimatedCost) {
          throw "رصيدك غير كافٍ.";
        }

        const newBalance = currentBalance - estimatedCost;
        const newTotalSpent = currentTotalSpent + estimatedCost;

        // Update user's balance and total spent
        transaction.update(userRef, { balance: newBalance, totalSpent: newTotalSpent });

        // Create the new order
        const newOrder: Omit<Order, 'id'> = {
          serviceId: selectedService.id,
          serviceName: `${selectedService.category} - ${selectedService.platform}`,
          quantity: numQuantity,
          charge: estimatedCost,
          orderDate: new Date().toISOString(),
          status: 'قيد التنفيذ', // Or 'pending'
          link: link,
        };
        transaction.set(doc(ordersRef), newOrder);
      });

      toast({ title: 'نجاح', description: 'تم إرسال طلبك بنجاح!' });
      // Reset form
      setSelectedCategory(null);
      setSelectedServiceId(null);
      setLink('');
      setQuantity('');

    } catch (error: any) {
      console.error("Order submission error: ", error);
      toast({ variant: 'destructive', title: 'فشل إرسال الطلب', description: error.toString() });
    }
  };


  // Function to seed some services for demonstration
  const seedServices = () => {
    if (!firestore) return;
    const servicesToSeed: Omit<Service, 'id'>[] = [
        { platform: "انستغرام", category: "متابعين", price: 5, min: 100, max: 10000 },
        { platform: "انستغرام", category: "إعجابات", price: 2, min: 50, max: 5000 },
        { platform: "فيسبوك", category: "إعجابات صفحة", price: 8, min: 100, max: 2000 },
        { platform: "يوتيوب", category: "مشاهدات", price: 3, min: 1000, max: 100000 },
    ];
    
    const servicesCol = collection(firestore, 'services');
    servicesToSeed.forEach(service => {
        addDocumentNonBlocking(servicesCol, service);
    });

    toast({ title: "تمت إضافة خدمات تجريبية بنجاح!" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="font-headline">طلب سريع</CardTitle>
                <CardDescription>
                ابدأ طلبك الجديد مباشرة من هنا.
                </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={seedServices}>إضافة خدمات تجريبية</Button>
        </div>
      </CardHeader>
      <CardContent>
        {servicesLoading ? <Skeleton className="h-[350px]" /> : (
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="category">الفئة</Label>
            <Select onValueChange={handleCategoryChange} value={selectedCategory || undefined}>
              <SelectTrigger id="category">
                <SelectValue placeholder="اختر فئة" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="service">الخدمة</Label>
            <Select disabled={!selectedCategory} onValueChange={setSelectedServiceId} value={selectedServiceId || undefined}>
              <SelectTrigger id="service">
                <SelectValue placeholder="اختر خدمة" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory && servicesByCategory[selectedCategory]?.map(service => (
                  <SelectItem key={service.id} value={service.id}>{service.platform} - ${service.price}/1k</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link">الرابط</Label>
            <Input id="link" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">الكمية</Label>
            <Input id="quantity" type="number" placeholder="1000" value={quantity} onChange={e => setQuantity(e.target.value)} required />
          </div>
          
          {selectedService && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md space-y-1">
                <p><strong>الوصف:</strong> {selectedService.platform} {selectedService.category}</p>
                <p><strong>التكلفة التقديرية:</strong> ${estimatedCost.toFixed(2)}</p>
                <p><strong>الحد الأدنى:</strong> {selectedService.min.toLocaleString()} | <strong>الحد الأقصى:</strong> {selectedService.max.toLocaleString()}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!selectedService}>
            إرسال الطلب
          </Button>
        </form>
        )}
      </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const { user: authUser } = useUser();
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
  const { data: ordersData, isLoading: isOrdersLoading } = useCollection<Order>(ordersQuery);

  const statusVariant = {
    مكتمل: 'default',
    'قيد التنفيذ': 'secondary',
    ملغي: 'destructive',
    جزئي: 'outline',
  } as const;

  if (isUserLoading || isOrdersLoading) {
    return (
      <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[120px]" />)}
          </div>
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-1">
          <Skeleton className="h-[550px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3 pb-4">
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>الرصيد</span>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(userData?.balance ?? 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">رصيد الحملات: ${(userData?.adBalance ?? 0).toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
               <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>إجمالي الإنفاق</span>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(userData?.totalSpent ?? 0).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">منذ الانضمام</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>الرتبة الحالية</span>
                 <Gem className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userData?.rank ?? '...'}</div>
              <p className="text-xs text-muted-foreground">خصم 0% على الخدمات</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>إجمالي الطلبات</span>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordersData?.length ?? 0}</div>
               <p className="text-xs text-muted-foreground">آخر 5 طلبات</p>
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
                    <YAxis yAxisId="left" orientation="right" stroke="hsl(var(--primary))" />
                    <YAxis yAxisId="right" orientation="left" stroke="hsl(var(--accent))" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="orders" fill="var(--color-orders)" radius={4} yAxisId="left" />
                    <Bar dataKey="spend" fill="var(--color-spend)" radius={4} yAxisId="right" />
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
                  <TableHead>الكمية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">التاريخ</TableHead>
                  <TableHead className="text-left">التكلفة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersData && ordersData.length > 0 ? (
                  ordersData.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.serviceName}</TableCell>
                      <TableCell>{order.quantity.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-left">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-left">${(order.charge ?? 0).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
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
        <QuickOrderForm user={authUser} userData={userData} />
      </div>
    </div>
  );
}
