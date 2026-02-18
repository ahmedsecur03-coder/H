
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { runTransaction, doc } from 'firebase/firestore';
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
import { Loader2, Info, Rocket, Timer, Gauge, TrendingDown, ShieldCheck, ListOrdered, Package } from 'lucide-react';
import type { Service, Order, User as UserType } from '@/lib/types';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { AnimatePresence, motion } from 'framer-motion';
import { useServices } from '@/hooks/useServices';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

function ServiceDescription({ service }: { service: Service }) {
    if (!service) return null;

    const details = [
        { label: "وقت البدء", value: service.startTime || "فوري", icon: Timer },
        { label: "السرعة", value: service.speed || "سريع", icon: Gauge },
        { label: "معدل النقص", value: service.dropRate || "0-1%", icon: TrendingDown },
        { label: "الضمان", value: service.guarantee ? "متوفر" : "لا يوجد", icon: ShieldCheck },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-3 text-sm overflow-hidden"
        >
             <h4 className="font-semibold text-foreground flex items-center gap-2 border-b pb-2 mb-3"><Info className="h-4 w-4"/>وصف الخدمة</h4>
             {service.description && (
                <p className="text-sm text-muted-foreground pb-3 border-b">{service.description}</p>
             )}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {details.map(detail => {
                    const Icon = detail.icon;
                    return (
                        <div key={detail.label} className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground flex items-center gap-1.5"><Icon className="h-3 w-3" /> {detail.label}</span>
                            <span className="font-semibold text-foreground text-right">{detail.value}</span>
                        </div>
                    )
                })}
            </div>
        </motion.div>
    );
}


export function QuickOrderForm({ user, userData }: { user: any, userData: UserType }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [platform, setPlatform] = useState<string>('');
    const [category, setCategory] = useState<string>('');
    const [serviceId, setServiceId] = useState<string>('');
    const [link, setLink] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { services: mergedServices, isLoading: servicesLoading } = useServices();

    const rank = getRankForSpend(userData?.totalSpent ?? 0);
    const discountPercentage = rank.discount / 100;
    
    const platforms = useMemo(() => mergedServices ? [...new Set(mergedServices.map(s => s.platform))] : [], [mergedServices]);
    
    const categories = useMemo(() => {
        if (!platform) return [];
        return [...new Set(mergedServices?.filter(s => s.platform === platform).map(s => s.category) || [])];
    }, [mergedServices, platform]);

    const services = useMemo(() => {
        if (!category) return [];
        return mergedServices?.filter(s => s.platform === platform && s.category === category) || [];
    }, [mergedServices, platform, category]);

    const selectedService = useMemo(() => mergedServices?.find(s => s.id === serviceId), [mergedServices, serviceId]);
    
    const orderCost = useMemo(() => {
        if (!selectedService || !quantity) return { base: 0, final: 0 };
        const qty = parseInt(quantity);
        const baseCost = (qty / 1000) * selectedService.price;
        const discount = baseCost * discountPercentage;
        const finalCost = baseCost - discount;
        return { base: baseCost, final: finalCost };
    }, [selectedService, quantity, discountPercentage]);

    useEffect(() => {
        setCategory('');
        setServiceId('');
    }, [platform]);

    useEffect(() => {
        setServiceId('');
    }, [category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numQuantity = parseInt(quantity, 10);
        
        if (!user || !firestore || !selectedService || !link || !numQuantity) {
            toast({ variant: "destructive", title: 'خطأ', description: 'الرجاء تعبئة جميع الحقول بشكل صحيح.' });
            return;
        }
        
        if (numQuantity < selectedService.min || numQuantity > selectedService.max) {
             toast({ variant: "destructive", title: 'خطأ في الكمية', description: `الكمية يجب أن تكون بين ${selectedService.min} و ${selectedService.max}.` });
            return;
        }

        if (userData.balance < orderCost.final) {
             toast({ variant: "destructive", title: 'رصيد غير كافٍ', description: `رصيدك ${userData.balance.toFixed(2)}$ لا يكفي لإتمام الطلب الذي تكلفته ${orderCost.final.toFixed(2)}$.` });
            return;
        }

        setIsSubmitting(true);
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
                await processOrderInTransaction(transaction, firestore, user.uid, orderData);
             });
             toast({ title: 'تم تقديم الطلب بنجاح!', description: 'طلبك الآن قيد التنفيذ.' });
             setLink('');
             setQuantity('');

        } catch (error: any) {
             const permissionError = new FirestorePermissionError({ path: `users/${user.uid}`, operation: 'update' });
             errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const cardVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
    };

    return (
        <Card className="overflow-hidden flex flex-col border-primary/10">
            <div className="p-6 bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-between">
                <div>
                    <CardTitle className="font-headline text-2xl">طلب خدمة سريعة</CardTitle>
                    <CardDescription>اختر الخدمة المناسبة لحسابك وابدأ النمو فوراً.</CardDescription>
                </div>
                <Rocket className="h-10 w-10 text-primary animate-pulse" />
            </div>

            <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                <CardContent className="space-y-4 pt-6 flex-grow">
                    <Select onValueChange={setPlatform} disabled={servicesLoading} value={platform}>
                        <SelectTrigger><SelectValue placeholder={servicesLoading ? 'جاري تحميل المنصات...' : '1. اختر المنصة'} /></SelectTrigger>
                        <SelectContent>
                            {platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <AnimatePresence>
                    {platform && (
                        <motion.div key="category-select" initial="hidden" animate="visible" exit="exit" variants={cardVariants}>
                            <Select onValueChange={setCategory} disabled={!platform || servicesLoading} value={category}>
                                <SelectTrigger><SelectValue placeholder="2. اختر الفئة" /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </motion.div>
                    )}
                    </AnimatePresence>

                     <AnimatePresence>
                    {category && (
                         <motion.div key="service-select" initial="hidden" animate="visible" exit="exit" variants={cardVariants}>
                            <Select onValueChange={setServiceId} value={serviceId} disabled={!category || servicesLoading}>
                                <SelectTrigger><SelectValue placeholder="3. اختر الخدمة" /></SelectTrigger>
                                <SelectContent>
                                    {services.map(s => 
                                        <SelectItem key={s.id} value={s.id} className="whitespace-normal text-right">
                                            {`#${s.id} - ${s.description} - $${(s.price).toFixed(4)}`}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                         </motion.div>
                    )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                        {selectedService && <ServiceDescription key="service-description" service={selectedService} />}
                    </AnimatePresence>


                    <AnimatePresence>
                    {serviceId && (
                         <motion.div key="order-inputs" initial="hidden" animate="visible" exit="exit" variants={cardVariants} className="space-y-4 pt-4 border-t">
                            <Input placeholder="4. أدخل الرابط (رابط البروفايل أو المنشور)" value={link} onChange={e => setLink(e.target.value)} required />
                            <Input type="number" placeholder={`5. أدخل الكمية (الحد الأدنى: ${selectedService?.min})`} value={quantity} onChange={e => setQuantity(e.target.value)} required min={selectedService?.min} max={selectedService?.max}/>
                        </motion.div>
                    )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                    {selectedService && quantity && (
                        <motion.div key="order-cost" initial={{ opacity: 0 }} animate={{ opacity: 1}} className="p-4 bg-muted rounded-md text-center border-2 border-primary/20">
                            <p className="text-sm text-muted-foreground">التكلفة الإجمالية</p>
                            <p className="text-3xl font-bold font-mono text-primary">${orderCost.final.toFixed(4)}</p>
                             {discountPercentage > 0 && (
                                <p className="text-[10px] text-green-500 mt-1 font-bold">
                                    تم تطبيق خصم رتبة {rank.name} بنسبة {rank.discount}%
                                </p>
                            )}
                        </motion.div>
                    )}
                    </AnimatePresence>
                </CardContent>

                <CardFooter className="mt-auto flex-col items-stretch gap-4 pt-6">
                    {serviceId && (
                        <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || servicesLoading}>
                            {isSubmitting ? <Loader2 className="animate-spin me-2" /> : <Package className="me-2 h-5 w-5" />}
                            تأكيد الطلب
                        </Button>
                    )}
                     <Separator />
                    <div className="grid grid-cols-2 gap-2">
                         <Button asChild variant="outline" size="sm"><Link href="/dashboard/orders"><ListOrdered className="ml-2 h-4 w-4" />سجل الطلبات</Link></Button>
                        <Button asChild variant="outline" size="sm"><Link href="/dashboard/mass-order"><Package className="ml-2 h-4 w-4" />طلب جماعي</Link></Button>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
