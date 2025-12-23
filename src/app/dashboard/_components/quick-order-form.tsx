
'use client';
import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { runTransaction, collection, doc, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Briefcase } from 'lucide-react';
import type { Service, Order, User as UserType } from '@/lib/types';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import Link from 'next/link';

export function QuickOrderForm({ user, userData }: { user: any, userData: UserType }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [platform, setPlatform] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [serviceId, setServiceId] = useState<string>('');
    const [link, setLink] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
    const { data: servicesData, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);
    
    const rank = getRankForSpend(userData?.totalSpent ?? 0);
    const discountPercentage = rank.discount / 100;
    
    const platforms = useMemo(() => servicesData ? [...new Set(servicesData.map(s => s.platform))] : [], [servicesData]);
    
    const categories = useMemo(() => {
        if (!platform) return [];
        return [...new Set(servicesData?.filter(s => s.platform === platform).map(s => s.category) || [])];
    }, [servicesData, platform]);

    const services = useMemo(() => {
        if (!category) return [];
        return servicesData?.filter(s => s.platform === platform && s.category === category) || [];
    }, [servicesData, platform, category]);

    const selectedService = useMemo(() => servicesData?.find(s => s.id === serviceId), [servicesData, serviceId]);
    
    const orderCost = useMemo(() => {
        if (!selectedService || !quantity) return { base: 0, final: 0 };
        const qty = parseInt(quantity);
        const baseCost = (qty / 1000) * selectedService.price;
        const discount = baseCost * discountPercentage;
        const finalCost = baseCost - discount;
        return { base: baseCost, final: finalCost };
    }, [selectedService, quantity, discountPercentage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numQuantity = parseInt(quantity, 10);
        
        if (!user || !firestore || !selectedService || !link || !numQuantity) {
            toast({ variant: "destructive", title: "خطأ", description: "الرجاء تعبئة جميع الحقول بشكل صحيح." });
            return;
        }
        
        if (numQuantity < selectedService.min || numQuantity > selectedService.max) {
             toast({ variant: "destructive", title: "خطأ في الكمية", description: `الكمية يجب أن تكون بين ${selectedService.min} و ${selectedService.max}.` });
            return;
        }

        if (userData.balance < orderCost.final) {
             toast({ variant: "destructive", title: "رصيد غير كاف", description: `رصيدك الحالي ($${userData.balance.toFixed(2)}) غير كافٍ لتغطية تكلفة الطلب ($${orderCost.final.toFixed(2)}).` });
            return;
        }

        setIsSubmitting(true);
        let promotionToast: { title: string; description: string } | null = null;
        try {
             await runTransaction(firestore, async (transaction) => {
                const orderData: Omit<Order, 'id'> = {
                    userId: user.uid,
                    serviceId: selectedService.id,
                    serviceName: `${selectedService.platform} - ${selectedService.category}`,
                    link: link,
                    quantity: numQuantity,
                    charge: orderCost.final,
                    orderDate: new Date().toISOString(),
                    status: 'قيد التنفيذ',
                };
                const result = await processOrderInTransaction(
                    transaction,
                    firestore,
                    user.uid,
                    orderData,
                );
                if (result.promotion) {
                    promotionToast = result.promotion;
                }
             });
             toast({ title: "تم استلام طلبك بنجاح!", description: "سيتم بدء تنفيذ طلبك قريباً." });
             if (promotionToast) {
                setTimeout(() => toast(promotionToast!), 1000);
             }
             setLink('');
             setQuantity('');

        } catch (error: any) {
             if (error.message.includes("رصيدك") || error.message.includes("المستخدم")) {
                 toast({ variant: "destructive", title: "فشل إرسال الطلب", description: error.message });
             } else {
                 const permissionError = new FirestorePermissionError({ path: `users/${user.uid}`, operation: 'update' });
                 errorEmitter.emit('permission-error', permissionError);
             }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card>
            <CardHeader className="space-y-4">
                <CardTitle className="font-headline">منطقة الإطلاق</CardTitle>
                 <div className="grid grid-cols-2 gap-4">
                     <Button variant="outline" asChild>
                         <Link href="/dashboard/campaigns">
                             <PlusCircle className="ml-2 h-4 w-4" />
                            إنشاء حملة إعلانية
                         </Link>
                     </Button>
                     <Button variant="outline" asChild>
                         <Link href="/dashboard/agency-accounts">
                            <Briefcase className="ml-2 h-4 w-4" />
                            فتح حساب اعلاني وكالة
                         </Link>
                    </Button>
                 </div>
                <CardDescription>
                    أو يمكنك تقديم طلب سريع مباشرة من هنا.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select onValueChange={val => { setPlatform(val); setCategory(''); setServiceId(''); }} disabled={servicesLoading}>
                            <SelectTrigger><SelectValue placeholder={servicesLoading ? "جاري التحميل..." : "اختر المنصة"} /></SelectTrigger>
                            <SelectContent>
                                {platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={val => { setCategory(val); setServiceId(''); }} disabled={!platform || servicesLoading}>
                            <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                         <Select onValueChange={setServiceId} value={serviceId} disabled={!category || servicesLoading}>
                            <SelectTrigger><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                            <SelectContent>
                                {services.map(s => <SelectItem key={s.id} value={s.id}>#{s.id} - ${s.price.toFixed(4)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <Input placeholder="الرابط (Link)" value={link} onChange={e => setLink(e.target.value)} required />
                    <Input type="number" placeholder="الكمية (Quantity)" value={quantity} onChange={e => setQuantity(e.target.value)} required />

                    {selectedService && quantity && (
                        <div className="p-4 bg-muted rounded-md text-center">
                            <p className="text-sm text-muted-foreground">التكلفة النهائية للطلب</p>
                            {discountPercentage > 0 && (
                                <p className="text-xs text-muted-foreground line-through">
                                    التكلفة الأصلية: ${orderCost.base.toFixed(4)}
                                </p>
                            )}
                            <p className="text-2xl font-bold font-mono">${orderCost.final.toFixed(4)}</p>
                             {discountPercentage > 0 && (
                                <p className="text-xs text-primary mt-1 font-semibold">
                                    تم تطبيق خصم {rank.discount}% لرتبة {rank.name}!
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting || servicesLoading}>
                        {isSubmitting ? <Loader2 className="animate-spin ml-2" /> : null}
                        إرسال الطلب
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

    