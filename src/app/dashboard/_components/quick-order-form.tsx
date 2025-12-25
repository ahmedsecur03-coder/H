
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { runTransaction, collection, doc, query, getDocs } from 'firebase/firestore';
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
import { Loader2, Info, Rocket, ChevronLeft, Sparkles, AlertTriangle, ChevronsRight, Timer, Gauge, TrendingDown, ShieldCheck } from 'lucide-react';
import type { Service, Order, User as UserType, ServicePrice } from '@/lib/types';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { SMM_SERVICES } from '@/lib/smm-services';
import { useServices } from '@/hooks/useServices';

const PROFIT_MARGIN = 1.50; // 50% profit margin

function ServiceDescription({ service }: { service: Service }) {
    if (!service) return null;

    const details = [
        { label: "وقت البدء", value: service.startTime, icon: Timer },
        { label: "السرعة", value: service.speed, icon: Gauge },
        { label: "معدل النقصان", value: service.dropRate, icon: TrendingDown },
        { label: "الضمان", value: service.guarantee ? 'متوفر' : 'غير متوفر', icon: ShieldCheck },
        { label: "متوسط الوقت", value: service.avgTime, icon: ChevronsRight },
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
                    if (!detail.value) return null;
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
        const baseCost = (qty / 1000) * selectedService.price * PROFIT_MARGIN; // Apply profit margin
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
             toast({ title: 'تم تقديم الطلب بنجاح!', description: 'طلبك الآن قيد التنفيذ.' });
             if (promotionToast) {
                setTimeout(() => toast(promotionToast!), 1000);
             }
             setLink('');
             setQuantity('');

        } catch (error: any) {
             if (error.message.includes("رصيدك") || error.message.includes("المستخدم")) {
                 toast({ variant: "destructive", title: 'فشل تقديم الطلب', description: error.message });
             } else {
                 const permissionError = new FirestorePermissionError({ path: `users/${user.uid}`, operation: 'update' });
                 errorEmitter.emit('permission-error', permissionError);
             }
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
        <Card className="overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-between">
                <div>
                    <CardTitle className="font-headline text-2xl">طلب سريع</CardTitle>
                    <CardDescription>أسرع طريقة لإضافة طلب جديد.</CardDescription>
                </div>
                <Rocket className="h-10 w-10 text-primary" />
            </div>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-6">
                    <Select onValueChange={setPlatform} disabled={servicesLoading} value={platform}>
                        <SelectTrigger><SelectValue placeholder={servicesLoading ? 'جاري التحميل...' : '1. اختر المنصة'} /></SelectTrigger>
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
                                        <SelectItem key={s.id} value={s.id}>
                                            {`#${s.id} - ${s.description} - $${(s.price * PROFIT_MARGIN).toFixed(4)}`}
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
                            <Input placeholder="4. أدخل الرابط" value={link} onChange={e => setLink(e.target.value)} required />
                            <Input type="number" placeholder={`5. أدخل الكمية (بين ${selectedService?.min} و ${selectedService?.max})`} value={quantity} onChange={e => setQuantity(e.target.value)} required min={selectedService?.min} max={selectedService?.max}/>
                        </motion.div>
                    )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                    {selectedService && quantity && (
                        <motion.div key="order-cost" initial={{ opacity: 0 }} animate={{ opacity: 1}} className="p-4 bg-muted rounded-md text-center">
                            <p className="text-sm text-muted-foreground">التكلفة النهائية</p>
                            {discountPercentage > 0 && (
                                <p className="text-xs text-muted-foreground line-through">
                                    التكلفة الأصلية: ${orderCost.base.toFixed(4)}
                                </p>
                            )}
                            <p className="text-2xl font-bold font-mono">${orderCost.final.toFixed(4)}</p>
                             {discountPercentage > 0 && (
                                <p className="text-xs text-primary mt-1 font-semibold">
                                    تم تطبيق خصم رتبة {rank.name} بنسبة {rank.discount}%
                                </p>
                            )}
                        </motion.div>
                    )}
                    </AnimatePresence>
                </CardContent>

                <AnimatePresence>
                {serviceId && (
                    <motion.div key="footer-submit" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isSubmitting || servicesLoading}>
                                {isSubmitting ? <Loader2 className="animate-spin me-2" /> : null}
                                إرسال الطلب
                            </Button>
                        </CardFooter>
                    </motion.div>
                )}
                </AnimatePresence>
            </form>
        </Card>
    );
}
