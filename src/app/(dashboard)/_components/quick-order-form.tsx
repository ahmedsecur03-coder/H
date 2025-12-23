
'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Flame, Loader2, Rocket } from 'lucide-react';
import type { Service, Order, User } from '@/lib/types';
import { collection, query, where, getDocs, runTransaction, doc, addDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

function QuickOrderFormComponent({ user, userData }: { user: any, userData: User }) {
    const firestore = useFirestore();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Fetch services
    const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
    const { data: services, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);

    const [platform, setPlatform] = useState('');
    const [category, setCategory] = useState('');
    const [serviceId, setServiceId] = useState('');
    const [link, setLink] = useState('');
    const [quantity, setQuantity] = useState('');
    const [cost, setCost] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate from query params
    useEffect(() => {
        const platformParam = searchParams.get('platform');
        if (platformParam) {
            setPlatform(decodeURIComponent(platformParam));
        }
    }, [searchParams]);

    const rank = getRankForSpend(userData.totalSpent);
    const discountPercentage = rank.discount / 100;

    const platforms = useMemo(() => services ? [...new Set(services.map(s => s.platform))] : [], [services]);
    const categories = useMemo(() => services ? [...new Set(services.filter(s => s.platform === platform).map(s => s.category))] : [], [services, platform]);
    const serviceOptions = useMemo(() => services ? services.filter(s => s.platform === platform && s.category === category) : [], [services, platform, category]);
    const selectedService = useMemo(() => services?.find(s => s.id === serviceId), [services, serviceId]);

    useEffect(() => {
        if (selectedService && quantity) {
            const qty = parseInt(quantity, 10);
            if (!isNaN(qty)) {
                const baseCost = (qty / 1000) * selectedService.price;
                const finalCost = baseCost - (baseCost * discountPercentage);
                setCost(finalCost);
            }
        } else {
            setCost(0);
        }
    }, [quantity, selectedService, discountPercentage]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const quantityNum = parseInt(quantity, 10);

        if (!firestore || !user || !selectedService || !link || !quantityNum) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء ملء جميع الحقول بشكل صحيح.' });
            return;
        }

        if (quantityNum < selectedService.min || quantityNum > selectedService.max) {
             toast({ variant: 'destructive', title: 'خطأ', description: `الكمية يجب أن تكون بين ${selectedService.min} و ${selectedService.max}.` });
             return;
        }

        if (userData.balance < cost) {
            toast({ variant: 'destructive', title: 'رصيدك غير كافٍ', description: `تحتاج إلى $${cost.toFixed(2)} لإتمام هذا الطلب.` });
            return;
        }
        
        setIsSubmitting(true);
        
        const orderData: Omit<Order, 'id'> = {
            userId: user.uid,
            serviceId: selectedService.id,
            serviceName: `${selectedService.platform} - ${selectedService.category}`,
            link: link,
            quantity: quantityNum,
            charge: cost,
            orderDate: new Date().toISOString(),
            status: 'قيد التنفيذ',
        };

        try {
            const { promotion } = await processOrderInTransaction(runTransaction, firestore, user.uid, orderData);
            
            toast({ title: 'تم استلام طلبك!', description: `طلبك للخدمة #${selectedService.id} قيد التنفيذ الآن.` });
            if (promotion) {
                setTimeout(() => toast(promotion), 1000);
            }
            // Reset form
            setLink(''); setQuantity(''); setCost(0);

        } catch (error: any) {
             if (error.message.includes("رصيدك")) {
                toast({ variant: "destructive", title: "فشل إرسال الطلب", description: error.message });
             } else {
                 const permissionError = new FirestorePermissionError({ path: `users/${user.uid}`, operation: 'update' });
                 errorEmitter.emit('permission-error', permissionError);
             }
        } finally {
            setIsSubmitting(false);
        }
    };


    if (servicesLoading) {
        return (
             <Card>
                <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-48 w-full" /></CardContent>
                <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Flame className="text-primary"/>
                    <span>اطلب الآن بسرعة الصاروخ</span>
                </CardTitle>
                <CardDescription>
                    أسهل وأسرع طريقة لطلب خدماتنا. اختر، أدخل، وانطلق! {rank.discount > 0 && `ستحصل على خصم ${rank.discount}% على جميع الطلبات.`}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select onValueChange={value => { setPlatform(value); setCategory(''); setServiceId(''); }} value={platform}>
                            <SelectTrigger><SelectValue placeholder="اختر المنصة" /></SelectTrigger>
                            <SelectContent>
                                {platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={value => { setCategory(value); setServiceId(''); }} value={category} disabled={!platform}>
                            <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <Select onValueChange={setServiceId} value={serviceId} disabled={!category}>
                        <SelectTrigger><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                        <SelectContent>
                            {serviceOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.category} - ${s.price}/1K - {s.id}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Input placeholder="الرابط" value={link} onChange={e => setLink(e.target.value)} required disabled={!serviceId} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input type="number" placeholder="الكمية" value={quantity} onChange={e => setQuantity(e.target.value)} required disabled={!serviceId} min={selectedService?.min} max={selectedService?.max} />
                        <Input readOnly value={`التكلفة: $${cost.toFixed(2)}`} className="font-bold text-center bg-muted" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting || !serviceId}>
                         {isSubmitting ? <Loader2 className="animate-spin ml-2"/> :  <Rocket className="ml-2" />}
                         {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export function QuickOrderForm({ user, userData }: { user: any, userData: User }) {
    return (
        <Suspense fallback={<Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>}>
            <QuickOrderFormComponent user={user} userData={userData} />
        </Suspense>
    )
}
