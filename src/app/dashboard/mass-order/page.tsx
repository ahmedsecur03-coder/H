
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { runTransaction, collection, doc, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ListOrdered, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import type { Service, Order, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useSearchParams } from 'next/navigation';
import { getRankForSpend, processOrderInTransaction } from '@/lib/service';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


type ProcessedLine = {
    line: number;
    serviceId: string;
    link: string;
    quantity: number;
    isValid: boolean;
    error?: string;
    cost?: number;
    finalCost?: number;

    service?: Service;
};

type BatchResult = {
    successCount: number;
    errorCount: number;
    totalCost: number;
    errors: string[];
};


export default function MassOrderPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [massOrderText, setMassOrderText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

    useEffect(() => {
        const prefill = searchParams.get('prefill');
        if (prefill) {
            setMassOrderText(decodeURIComponent(prefill));
        }
    }, [searchParams]);

    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData } = useDoc<User>(userDocRef);

    const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
    const { data: servicesData, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);
    
    const rank = getRankForSpend(userData?.totalSpent ?? 0);
    const discountPercentage = rank.discount / 100;

    const handleMassOrderSubmit = async () => {
        if (!massOrderText.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'حقل الطلب الجماعي فارغ. الرجاء إدخال طلباتك.' });
            return;
        }
        if (!userData || !servicesData || !firestore || !authUser) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن معالجة الطلب حاليًا. الرجاء المحاولة مرة أخرى.' });
            return;
        }

        setIsProcessing(true);
        setBatchResult(null);
        
        const lines = massOrderText.trim().split('\n');
        let totalFinalCost = 0;
        const processedLines: ProcessedLine[] = [];
        const finalErrors: string[] = [];

        // 1. Parse and validate each line
        lines.forEach((line, index) => {
            const parts = line.split('|');
            if (parts.length !== 3) {
                processedLines.push({ line: index + 1, serviceId: '', link: '', quantity: 0, isValid: false, error: 'تنسيق غير صالح.' });
                return;
            }

            const [serviceId, link, quantityStr] = parts.map(p => p.trim());
            const quantity = parseInt(quantityStr, 10);
            const service = servicesData.find(s => s.id === serviceId);


            const pLine: ProcessedLine = { line: index + 1, serviceId, link, quantity, isValid: true };

            if (!service) {
                pLine.isValid = false;
                pLine.error = 'الخدمة غير موجودة.';
            } else if (isNaN(quantity) || quantity <= 0) {
                pLine.isValid = false;
                pLine.error = 'كمية غير صالحة.';
            } else if (quantity < service.min || quantity > service.max) {
                pLine.isValid = false;
                pLine.error = `الكمية يجب أن تكون بين ${service.min} و ${service.max}.`;
            } else {
                const baseCost = (quantity / 1000) * service.price;
                const discount = baseCost * discountPercentage;
                pLine.cost = baseCost;
                pLine.finalCost = baseCost - discount;
                pLine.service = service;
                totalFinalCost += pLine.finalCost;
            }
            processedLines.push(pLine);
        });
        
        const validLines = processedLines.filter(p => p.isValid);
        const invalidLines = processedLines.filter(p => !p.isValid);

        if (invalidLines.length > 0) {
            invalidLines.forEach(p => finalErrors.push(`السطر ${p.line}: ${p.error}`));
        }
        
        if (validLines.length === 0) {
             setBatchResult({ successCount: 0, errorCount: lines.length, totalCost: 0, errors: finalErrors.length > 0 ? finalErrors : ['لم يتم العثور على طلبات صالحة.'] });
             setIsProcessing(false);
             return;
        }

        if (userData.balance < totalFinalCost) {
            finalErrors.push(`رصيدك غير كافٍ. التكلفة الإجمالية: $${totalFinalCost.toFixed(2)}، رصيدك: $${userData.balance.toFixed(2)}`);
            setBatchResult({ successCount: 0, errorCount: lines.length, totalCost: totalFinalCost, errors: finalErrors });
            setIsProcessing(false);
            return;
        }

        // 3. Execute transaction
        let promotionToast: { title: string; description: string } | null = null;
        try {
            await runTransaction(firestore, async (transaction) => {
                for (const pLine of validLines) {
                     if (pLine.isValid && pLine.finalCost && pLine.service) {
                        const orderData: Omit<Order, 'id'> = {
                            userId: authUser!.uid,
                            serviceId: pLine.service.id,
                            serviceName: `${pLine.service.platform} - ${pLine.service.category}`,
                            link: pLine.link,
                            quantity: pLine.quantity,
                            charge: pLine.finalCost,
                            orderDate: new Date().toISOString(),
                            status: 'قيد التنفيذ',
                        };
    
                        const result = await processOrderInTransaction(
                            transaction,
                            firestore,
                            authUser.uid,
                            orderData,
                        );
                        
                        if (result.promotion) {
                            promotionToast = result.promotion;
                        }
                     }
                }
    
            });
            
            toast({ title: 'نجاح', description: `تم تقديم ${validLines.length} طلب بنجاح.` });
            if (promotionToast) {
                setTimeout(() => toast(promotionToast!), 1000);
            }
            setBatchResult({ successCount: validLines.length, errorCount: invalidLines.length, totalCost: totalFinalCost, errors: finalErrors });
            setMassOrderText('');

        } catch (error: any) {
             if (error.message.includes("رصيدك") || error.message.includes("المستخدم")) {
                 finalErrors.push(error.message);
                 toast({ variant: "destructive", title: 'فشل تنفيذ الطلب الجماعي', description: error.message });
             } else {
                 const permissionError = new FirestorePermissionError({ path: `users/${authUser.uid}`, operation: 'update' });
                 errorEmitter.emit('permission-error', permissionError);
                 const defaultError = 'حدث خطأ متعلق بالصلاحيات أثناء تنفيذ الطلبات.';
                 finalErrors.push(defaultError);
             }
             setBatchResult({ successCount: 0, errorCount: lines.length, totalCost: 0, errors: finalErrors });
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">طلب جماعي</h1>
                <p className="text-muted-foreground">
                    أضف طلبات متعددة دفعة واحدة لتوفير الوقت والجهد.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>إدخال الطلبات</CardTitle>
                    <CardDescription>
                        كل طلب يجب أن يكون في سطر منفصل بالتنسيق التالي: <code className="font-mono bg-muted p-1 rounded-md">id|link|quantity</code>
                        <br/>
                        مثال: <code className="font-mono text-xs">1|https://instagram.com/p/abc|1000</code>
                        <br/>
                        {rank.discount > 0 && `ستحصل على خصم رتبتك (${rank.name}) البالغ ${rank.discount}% على جميع الطلبات.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder={`1|https://instagram.com/user1|1000
2|https://youtube.com/watch?v=abc|5000
5|https://facebook.com/page|200`}
                        className="min-h-[250px] text-left ltr bg-input"
                        value={massOrderText}
                        onChange={(e) => setMassOrderText(e.target.value)}
                        disabled={isProcessing}
                    />
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleMassOrderSubmit} disabled={isProcessing || servicesLoading}>
                        {isProcessing ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ListOrdered className="me-2 h-4 w-4" />
                        )}
                        {isProcessing ? 'جاري المعالجة...' : 'إرسال الطلبات'}
                    </Button>
                </CardFooter>
            </Card>

            {batchResult && (
                 <Card>
                    <CardHeader>
                      <CardTitle>نتائج المعالجة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {batchResult.errorCount === 0 ? (
                            <Alert variant="default" className="border-green-500 text-green-700 dark:text-green-400">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertTitle>نجاح كامل</AlertTitle>
                                <AlertDescription>
                                    تمت معالجة جميع طلباتك بنجاح.
                                </AlertDescription>
                            </Alert>
                        ) : (
                             <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>نجاح جزئي أو فشل</AlertTitle>
                                <AlertDescription>
                                    {batchResult.successCount > 0 ? 'تمت معالجة بعض الطلبات بنجاح، بينما فشلت طلبات أخرى.' : 'فشلت معالجة جميع الطلبات المدخلة.'}
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">الطلبات الناجحة</p>
                                <p className="text-2xl font-bold">{batchResult.successCount}</p>
                            </div>
                             <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">الطلبات الخاطئة</p>
                                <p className="text-2xl font-bold text-destructive">{batchResult.errorCount}</p>
                            </div>
                             <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">التكلفة الإجمالية</p>
                                <p className="text-2xl font-bold">${batchResult.totalCost.toFixed(2)}</p>
                            </div>
                        </div>
                        {batchResult.errors.length > 0 && (
                            <div>
                               <Separator className="my-4" />
                               <h4 className="font-semibold mb-2">تفاصيل الأخطاء:</h4>
                               <div className="space-y-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md max-h-40 overflow-y-auto">
                                {batchResult.errors.map((error, i) => (
                                    <p key={i} className="font-mono text-xs">{error}</p>
                                ))}
                               </div>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            )}
        </div>
    );
}
