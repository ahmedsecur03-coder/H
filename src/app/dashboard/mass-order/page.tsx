'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { runTransaction, collection, doc, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListOrdered, Loader2, PlusCircle, Trash2, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import type { Service, Order, User } from '@/lib/types';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { SMM_SERVICES } from '@/lib/smm-services';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';

// A unique ID for each row to handle React keys
let rowIdCounter = 0;
const PROFIT_MARGIN = 1.50; // 50% profit margin

type OrderRow = {
    id: number;
    platform: string;
    category: string;
    serviceId: string;
    link: string;
    quantity: string;
    cost: number;
};

function MassOrderRow({
    row,
    updateRow,
    removeRow,
    duplicateRow,
    platforms,
    categories,
    services,
    isProcessing,
    discountPercentage,
}: {
    row: OrderRow;
    updateRow: (id: number, data: Partial<OrderRow>) => void;
    removeRow: (id: number) => void;
    duplicateRow: (id: number) => void;
    platforms: string[];
    categories: string[];
    services: Service[];
    isProcessing: boolean;
    discountPercentage: number;
}) {
    const selectedService = services.find(s => s.id === row.serviceId);

    useEffect(() => {
        let finalCost = 0;
        if (selectedService && row.quantity) {
            const baseCost = (parseInt(row.quantity, 10) / 1000) * selectedService.price * PROFIT_MARGIN; // Apply profit margin
            finalCost = baseCost - (baseCost * discountPercentage);
        }
        if (finalCost !== row.cost) {
            updateRow(row.id, { cost: finalCost });
        }
    }, [row.quantity, selectedService, discountPercentage, row.cost, row.id, updateRow]);


    const handlePlatformChange = (value: string) => {
        updateRow(row.id, { platform: value, category: '', serviceId: '' });
    };

    const handleCategoryChange = (value: string) => {
        updateRow(row.id, { category: value, serviceId: '' });
    };

    return (
        <div className="p-4 border rounded-lg space-y-3 relative bg-muted/30">
             <div className="absolute top-1 right-1 rtl:left-1 rtl:right-auto flex gap-1">
                 <Button type="button" variant="ghost" size="icon" onClick={() => duplicateRow(row.id)} disabled={isProcessing} className="h-7 w-7 text-muted-foreground hover:text-primary">
                    <Copy className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)} disabled={isProcessing} className="h-7 w-7 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Select value={row.platform} onValueChange={handlePlatformChange} disabled={isProcessing}>
                    <SelectTrigger><SelectValue placeholder="اختر المنصة" /></SelectTrigger>
                    <SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>

                <Select value={row.category} onValueChange={handleCategoryChange} disabled={!row.platform || isProcessing}>
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>

                <Select value={row.serviceId} onValueChange={(v) => updateRow(row.id, { serviceId: v })} disabled={!row.category || isProcessing}>
                    <SelectTrigger><SelectValue placeholder="اختر الخدمة" /></SelectTrigger>
                    <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{`#${s.id} - ${s.description} - $${(s.price * PROFIT_MARGIN).toFixed(4)}`}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                 <Input 
                    placeholder="الرابط..." 
                    value={row.link} 
                    onChange={(e) => updateRow(row.id, { link: e.target.value })}
                    disabled={isProcessing}
                    className="md:col-span-2"
                />
                 <Input 
                    type="number" 
                    placeholder="الكمية..."
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                    disabled={isProcessing}
                />
            </div>
            <div className="flex justify-between items-center text-sm">
                <div className="text-muted-foreground">
                    {selectedService && `الحدود: ${selectedService.min} / ${selectedService.max}`}
                </div>
                <div className="font-semibold">
                    التكلفة: <span className="font-mono text-primary">${row.cost.toFixed(4)}</span>
                </div>
            </div>
        </div>
    );
}

function MassOrderPageComponent() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [rows, setRows] = useState<OrderRow[]>([{ id: ++rowIdCounter, platform: '', category: '', serviceId: '', link: '', quantity: '', cost: 0 }]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const userDocRef = useMemoFirebase(() => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null), [firestore, authUser]);
    const { data: userData, isLoading: isUserLoading } = useDoc<User>(userDocRef);
    
    useEffect(() => {
        const prefillData = searchParams.get('prefill');
        if (prefillData) {
            try {
                const [serviceId, link, quantity] = decodeURIComponent(prefillData).split('|');
                const service = SMM_SERVICES.find(s => s.id === serviceId);
                if (service) {
                    const newRow: OrderRow = {
                        id: ++rowIdCounter,
                        platform: service.platform,
                        category: service.category,
                        serviceId: service.id,
                        link: link.trim(),
                        quantity: quantity.trim(),
                        cost: 0, // Will be recalculated by useEffect in MassOrderRow
                    };
                    setRows([newRow]);
                }
            } catch (e) {
                console.error("Failed to parse prefill data", e);
            }
        }
    }, [searchParams]);

    const rank = getRankForSpend(userData?.totalSpent ?? 0);
    const discountPercentage = rank.discount / 100;

    const platforms = useMemo(() => [...new Set(SMM_SERVICES.map(s => s.platform))], []);

    const getCategoriesForPlatform = (platform: string) => {
        return [...new Set(SMM_SERVICES.filter(s => s.platform === platform).map(s => s.category))];
    };

    const getServicesForCategory = (platform: string, category: string) => {
        return SMM_SERVICES.filter(s => s.platform === platform && s.category === category);
    };

    const addRow = () => {
        setRows(prev => [...prev, { id: ++rowIdCounter, platform: '', category: '', serviceId: '', link: '', quantity: '', cost: 0 }]);
    };

    const updateRow = useCallback((id: number, data: Partial<OrderRow>) => {
        setRows(prev => prev.map(row => row.id === id ? { ...row, ...data } : row));
    }, []);

    const removeRow = (id: number) => {
        setRows(prev => prev.filter(row => row.id !== id));
    };

    const duplicateRow = (id: number) => {
        setRows(prev => {
            const rowIndex = prev.findIndex(row => row.id === id);
            if (rowIndex === -1) return prev;
            
            const rowToDuplicate = prev[rowIndex];
            const newRow = { ...rowToDuplicate, id: ++rowIdCounter };
            
            const newRows = [...prev];
            newRows.splice(rowIndex + 1, 0, newRow);
            return newRows;
        });
    };
    
    const { totalCost, validRows } = useMemo(() => {
        const validRows = rows.filter(row => {
            const service = SMM_SERVICES.find(s => s.id === row.serviceId);
            const quantity = parseInt(row.quantity, 10);
            return service && row.link && !isNaN(quantity) && quantity >= service.min && quantity <= service.max;
        });
        const totalCost = validRows.reduce((acc, row) => acc + row.cost, 0);
        return { totalCost, validRows };
    }, [rows]);

    const handleMassOrderSubmit = async () => {
        if (!userData || !firestore || !authUser) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن معالجة الطلب حاليًا.' });
            return;
        }

        if (validRows.length === 0) {
            toast({ variant: 'destructive', title: 'لا توجد طلبات صالحة', description: 'الرجاء التأكد من ملء جميع الحقول بشكل صحيح ومراعاة حدود الكمية.' });
            return;
        }
        
        if (userData.balance < totalCost) {
            toast({ variant: 'destructive', title: 'رصيد غير كافٍ', description: `التكلفة الإجمالية ${totalCost.toFixed(2)}$ تتجاوز رصيدك ${userData.balance.toFixed(2)}$.` });
            return;
        }

        setIsProcessing(true);
        toast({ title: 'جاري إرسال الطلبات...', description: `سيتم معالجة ${validRows.length} طلب.` });

        try {
            await runTransaction(firestore, async (transaction) => {
                for (const row of validRows) {
                    const service = SMM_SERVICES.find(s => s.id === row.serviceId)!; // We know it's valid
                    const orderData: Omit<Order, 'id'> = {
                        userId: authUser.uid,
                        serviceId: service.id,
                        serviceName: `${service.platform} - ${service.category}`,
                        link: row.link,
                        quantity: parseInt(row.quantity, 10),
                        charge: row.cost,
                        orderDate: new Date().toISOString(),
                        status: 'قيد التنفيذ',
                    };
                    await processOrderInTransaction(transaction, firestore, authUser.uid, orderData);
                }
            });
            
            toast({ title: 'نجاح!', description: `تم تقديم ${validRows.length} طلب بنجاح.` });
            setRows([{ id: ++rowIdCounter, platform: '', category: '', serviceId: '', link: '', quantity: '', cost: 0 }]);
        } catch (error: any) {
            const permissionError = new FirestorePermissionError({ path: `users/${authUser.uid}`, operation: 'update' });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (isUserLoading) {
        return <Skeleton className="h-96 w-full" />;
    }

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">طلب جماعي متطور</h1>
                <p className="text-muted-foreground">أضف طلبات متعددة دفعة واحدة بسهولة وسرعة.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>قائمة الطلبات</CardTitle>
                    <CardDescription>
                        أنشئ قائمة طلباتك وأرسلها دفعة واحدة. {rank.discount > 0 && `سيتم تطبيق خصم رتبتك (${rank.name}) البالغ ${rank.discount}% تلقائيًا.`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {rows.map((row, index) => (
                        <MassOrderRow 
                            key={row.id}
                            row={row}
                            updateRow={updateRow}
                            removeRow={removeRow}
                            duplicateRow={duplicateRow}
                            platforms={platforms}
                            categories={getCategoriesForPlatform(row.platform)}
                            services={getServicesForCategory(row.platform, row.category)}
                            isProcessing={isProcessing}
                            discountPercentage={discountPercentage}
                        />
                    ))}
                    <Button type="button" variant="outline" onClick={addRow} disabled={isProcessing}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة طلب آخر
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-lg">
                        <span>التكلفة الإجمالية: </span>
                        <span className="font-bold font-mono text-primary">${totalCost.toFixed(4)}</span>
                        <span className="text-sm text-muted-foreground"> ({validRows.length} طلب صالح)</span>
                    </div>
                    <Button onClick={handleMassOrderSubmit} disabled={isProcessing || validRows.length === 0} size="lg">
                        {isProcessing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <ListOrdered className="me-2 h-4 w-4" />}
                        {isProcessing ? 'جاري المعالجة...' : `إرسال ${validRows.length} طلب`}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}


export default function MassOrderPage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <MassOrderPageComponent />
        </Suspense>
    )
}
