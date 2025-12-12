
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, FirestorePermissionError, errorEmitter } from '@/firebase';
import { doc, collection, query, runTransaction } from 'firebase/firestore';
import type { User as UserType, Order, Service } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

function QuickOrderFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

export function QuickOrderForm({ user, userData }: { user: any, userData: UserType }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>();
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openServiceSelector, setOpenServiceSelector] = useState(false);

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
      toast({ variant: "destructive", title: "رصيد غير كافٍ", description: `رصيدك الحالي ($${userData.balance.toFixed(2)}) لا يكفي لإتمام هذا الطلب الذي تبلغ تكلفته ($${cost.toFixed(2)}).` });
      return;
    }

    setIsSubmitting(true);

    const newOrderData: Omit<Order, 'id'> = {
        userId: user.uid,
        serviceId: selectedService.id,
        serviceName: `${selectedService.platform} - ${selectedService.category}`,
        link: link,
        quantity: numQuantity,
        charge: cost,
        orderDate: new Date().toISOString(),
        status: 'قيد التنفيذ',
    };
    
    try {
        const result = await runTransaction(firestore, async (transaction) => {
           return processOrderInTransaction(transaction, firestore, user.uid, newOrderData);
        });

        if (!result) {
            setIsSubmitting(false);
            return;
        };

        toast({ title: "تم إرسال الطلب بنجاح!", description: `التكلفة: $${cost.toFixed(2)}` });
        if(result.promotion) {
            setTimeout(() => toast(result.promotion), 1000);
        }
        setSelectedServiceId(undefined);
        setLink('');
        setQuantity('');
        setCost(0);

    } catch(error: any) {
        const userDocRef = doc(firestore, "users", user.uid);
        if(error.message.includes("رصيدك") || error.message.includes("User performing")) {
            toast({ variant: "destructive", title: "فشل إرسال الطلب", description: error.message });
        } else {
             const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
             });
             errorEmitter.emit('permission-error', permissionError);
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  if (servicesLoading) {
    return <QuickOrderFormSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">تقديم طلب جديد</CardTitle>
      </CardHeader>
      <CardContent>
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
                     <div className="flex justify-between text-lg text-primary">
                        <span className="font-bold">السعر:</span>
                        <span className="font-bold">${cost.toFixed(4)}</span>
                     </div>
                     <p className="text-xs text-muted-foreground">(خصم {discountPercentage*100}%)</p>
                </div>

                <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'شراء الخدمة'}
                </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
