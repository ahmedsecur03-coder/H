
'use client';
import { useState, useMemo, useEffect } from 'react';
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
import { Loader2, PlusCircle, Briefcase, Rocket, ChevronLeft } from 'lucide-react';
import type { Service, Order, User as UserType } from '@/lib/types';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';

export function QuickOrderForm({ user, userData }: { user: any, userData: UserType }) {
    const { t } = useTranslation();
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
            toast({ variant: "destructive", title: t('error'), description: t('quickOrderForm.fillAllFieldsError') });
            return;
        }
        
        if (numQuantity < selectedService.min || numQuantity > selectedService.max) {
             toast({ variant: "destructive", title: t('quickOrderForm.quantityErrorTitle'), description: t('quickOrderForm.quantityErrorDesc', { min: selectedService.min, max: selectedService.max }) });
            return;
        }

        if (userData.balance < orderCost.final) {
             toast({ variant: "destructive", title: t('quickOrderForm.insufficientFundsTitle'), description: t('quickOrderForm.insufficientFundsDesc', { balance: userData.balance.toFixed(2), cost: orderCost.final.toFixed(2) }) });
            return;
        }

        setIsSubmitting(true);
        let promotionToast: { title: string; description: string } | null = null;
        try {
             // This is a complex transaction, it MUST be awaited.
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
             toast({ title: t('quickOrderForm.successTitle'), description: t('quickOrderForm.successDesc') });
             if (promotionToast) {
                setTimeout(() => toast(promotionToast!), 1000);
             }
             setLink('');
             setQuantity('');

        } catch (error: any) {
             if (error.message.includes("رصيدك") || error.message.includes("المستخدم")) {
                 toast({ variant: "destructive", title: t('quickOrderForm.submitErrorTitle'), description: error.message });
             } else {
                 const permissionError = new FirestorePermissionError({ path: `users/${user.uid}`, operation: 'update' });
                 errorEmitter.emit('permission-error', permissionError);
             }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const cardVariants = {
        hidden: { opacity: 0, y: -20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <Card className="overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-between">
                <div>
                    <CardTitle className="font-headline text-2xl">{t('quickOrderForm.title')}</CardTitle>
                    <CardDescription>{t('quickOrderForm.description')}</CardDescription>
                </div>
                <Rocket className="h-10 w-10 text-primary" />
            </div>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 pt-6">
                    <Select onValueChange={setPlatform} disabled={servicesLoading} value={platform}>
                        <SelectTrigger><SelectValue placeholder={servicesLoading ? t('loading') : t('quickOrderForm.platformPlaceholder')} /></SelectTrigger>
                        <SelectContent>
                            {platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <AnimatePresence>
                    {platform && (
                        <motion.div initial="hidden" animate="visible" exit="hidden" variants={cardVariants} className="space-y-4">
                            <Select onValueChange={setCategory} disabled={!platform || servicesLoading} value={category}>
                                <SelectTrigger><SelectValue placeholder={t('quickOrderForm.categoryPlaceholder')} /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </motion.div>
                    )}
                    {category && (
                         <motion.div initial="hidden" animate="visible" exit="hidden" variants={cardVariants} className="space-y-4">
                            <Select onValueChange={setServiceId} value={serviceId} disabled={!category || servicesLoading}>
                                <SelectTrigger><SelectValue placeholder={t('quickOrderForm.servicePlaceholder')} /></SelectTrigger>
                                <SelectContent>
                                    {services.map(s => <SelectItem key={s.id} value={s.id}>#{s.id} - ${s.price.toFixed(4)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                         </motion.div>
                    )}
                    {serviceId && (
                         <motion.div initial="hidden" animate="visible" exit="hidden" variants={cardVariants} className="space-y-4">
                            <Input placeholder={t('quickOrderForm.linkPlaceholder')} value={link} onChange={e => setLink(e.target.value)} required />
                            <Input type="number" placeholder={t('quickOrderForm.quantityPlaceholder')} value={quantity} onChange={e => setQuantity(e.target.value)} required />
                        </motion.div>
                    )}
                    </AnimatePresence>
                    

                    {selectedService && quantity && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1}} className="p-4 bg-muted rounded-md text-center">
                            <p className="text-sm text-muted-foreground">{t('quickOrderForm.finalCost')}</p>
                            {discountPercentage > 0 && (
                                <p className="text-xs text-muted-foreground line-through">
                                    {t('quickOrderForm.originalCost')}: ${orderCost.base.toFixed(4)}
                                </p>
                            )}
                            <p className="text-2xl font-bold font-mono">${orderCost.final.toFixed(4)}</p>
                             {discountPercentage > 0 && (
                                <p className="text-xs text-primary mt-1 font-semibold">
                                    {t('quickOrderForm.discountApplied', { discount: rank.discount, rankName: t(`ranks.${rank.name}`) })}
                                </p>
                            )}
                        </motion.div>
                    )}
                </CardContent>
                {serviceId && (
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isSubmitting || servicesLoading}>
                            {isSubmitting ? <Loader2 className="animate-spin me-2" /> : null}
                            {t('quickOrderForm.submitButton')}
                        </Button>
                    </CardFooter>
                )}
            </form>
        </Card>
    );
}
