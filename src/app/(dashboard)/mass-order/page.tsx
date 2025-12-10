'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { runTransaction, collection, doc, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ListOrdered, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import type { Service, Order, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

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

const RANKS = [
  { name: 'مستكشف نجمي', spend: 0, discount: 0 },
  { name: 'قائد صاروخي', spend: 500, discount: 2 },
  { name: 'سيد المجرة', spend: 2500, discount: 5 },
  { name: 'سيد كوني', spend: 10000, discount: 10 },
];

function getRankForSpend(spend: number) {
  let currentRank = RANKS[0];
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (spend >= RANKS[i].spend) {
      currentRank = RANKS[i];
      break;
    }
  }
  return currentRank;
}


export default function MassOrderPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [massOrderText, setMassOrderText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData } = useDoc<User>(userDocRef);

    const servicesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'services')) : null, [firestore]);
    const { data: servicesData, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);

    const servicesMap = useMemo(() => {
        if (!servicesData) return new Map<string, Service>();
        return new Map(servicesData.map(service => [service.id, service]));
    }, [servicesData]);

    const handleMassOrderSubmit = async () => {
        if (!massOrderText.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'حقل الطلبات فارغ.' });
            return;
        }
        if (!userData || !servicesData) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن معالجة الطلب، جاري تحميل البيانات.' });
            return;
        }

        setIsProcessing(true);
        setBatchResult(null);

        const currentRank = getRankForSpend(userData.totalSpent);
        const discountPercentage = currentRank.discount / 100;
        
        const lines = massOrderText.trim().split('\n');
        let totalFinalCost = 0;
        const processedLines: ProcessedLine[] = [];
        const finalErrors: string[] = [];

        // 1. Parse and validate each line
        lines.forEach((line, index) => {
            const parts = line.split('|');
            if (parts.length !== 3) {
                processedLines.push({ line: index + 1, serviceId: '', link: '', quantity: 0, isValid: false, error: 'التنسيق غير صحيح.' });
                return;
            }

            const [serviceId, link, quantityStr] = parts;
            const quantity = parseInt(quantityStr, 10);
            const service = servicesMap.get(serviceId);

            const pLine: ProcessedLine = { line: index + 1, serviceId, link, quantity, isValid: true };

            if (!service) {
                pLine.isValid = false;
                pLine.error = 'معرف الخدمة غير موجود.';
            } else if (isNaN(quantity) || quantity <= 0) {
                pLine.isValid = false;
                pLine.error = 'الكمية غير صالحة.';
            } else if (quantity < service.min || quantity > service.max) {
                pLine.isValid = false;
                pLine.error = `الكمية خارج الحدود (${service.min} - ${service.max}).`;
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

        const invalidLines = processedLines.filter(p => !p.isValid);
        if (invalidLines.length > 0) {
            invalidLines.forEach(p => finalErrors.push(`السطر ${p.line}: ${p.error}`));
            setBatchResult({ successCount: 0, errorCount: lines.length, totalCost: 0, errors: finalErrors });
            setIsProcessing(false);
            return;
        }
        
        if (userData.balance < totalFinalCost) {
            finalErrors.push(`رصيدك غير كافٍ. التكلفة الإجمالية: $${totalFinalCost.toFixed(2)}، رصيدك: $${userData.balance.toFixed(2)}.`);
            setBatchResult({ successCount: 0, errorCount: lines.length, totalCost: totalFinalCost, errors: finalErrors });
            setIsProcessing(false);
            return;
        }

        // 3. Execute transaction
        try {
            await runTransaction(firestore!, async (transaction) => {
                const userRef = doc(firestore!, 'users', authUser!.uid);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");
                
                const currentData = userDoc.data();
                const currentBalance = currentData.balance;
                if (currentBalance < totalFinalCost) throw new Error("رصيدك غير كافٍ.");

                const newTotalSpent = currentData.totalSpent + totalFinalCost;
                const newRank = getRankForSpend(newTotalSpent).name;

                transaction.update(userRef, { 
                    balance: currentBalance - totalFinalCost,
                    totalSpent: newTotalSpent,
                    rank: newRank,
                });

                for (const pLine of processedLines) {
                    if (pLine.isValid && pLine.finalCost && pLine.service) {
                        const newOrderRef = doc(collection(firestore!, `users/${authUser!.uid}/orders`));
                        const newOrder: Omit<Order, 'id'> = {
                            userId: authUser!.uid,
                            serviceId: pLine.serviceId,
                            serviceName: `${pLine.service.category} - ${pLine.service.platform}`,
                            link: pLine.link,
                            quantity: pLine.quantity,
                            charge: pLine.finalCost,
                            orderDate: new Date().toISOString(),
                            status: 'قيد التنفيذ',
                        };
                        transaction.set(newOrderRef, newOrder);
                    }
                }
            });
            
            toast({ title: 'نجاح', description: 'تم إرسال جميع الطلبات بنجاح.' });
            setBatchResult({ successCount: processedLines.length, errorCount: 0, totalCost: totalFinalCost, errors: [] });
            setMassOrderText('');

        } catch (error: any) {
             console.error("Mass order transaction failed:", error);
             toast({ variant: "destructive", title: "فشل إرسال الطلب الجماعي", description: error.toString() });
             setBatchResult({ successCount: 0, errorCount: lines.length, totalCost: 0, errors: [error.message] });
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">طلب جماعي</h1>
                <p className="text-muted-foreground">
                    أضف طلبات متعددة بسرعة عن طريق لصقها في الحقل أدناه.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>إدخال الطلبات</CardTitle>
                    <CardDescription>
                        اتبع التنسيق التالي لكل طلب في سطر منفصل: <code>id_الخدمة|الرابط|الكمية</code>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder={`1|https://instagram.com/user1|1000\n2|https://youtube.com/watch?v=abc|5000\n5|https://facebook.com/page|200`}
                        className="min-h-[250px] text-left ltr"
                        value={massOrderText}
                        onChange={(e) => setMassOrderText(e.target.value)}
                        disabled={isProcessing}
                    />
                    <Button onClick={handleMassOrderSubmit} disabled={isProcessing || servicesLoading}>
                        {isProcessing ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ListOrdered className="ml-2 h-4 w-4" />
                        )}
                        {isProcessing ? 'جاري المعالجة...' : 'إرسال الطلبات'}
                    </Button>
                </CardContent>
            </Card>

            {batchResult && (
                 <Card>
                    <CardHeader>
                      <CardTitle>نتائج الطلب الجماعي</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {batchResult.errorCount === 0 ? (
                            <Alert variant="default" className="border-green-500 text-green-700">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertTitle>نجاح كامل</AlertTitle>
                                <AlertDescription>
                                    تم إرسال جميع الطلبات بنجاح.
                                </AlertDescription>
                            </Alert>
                        ) : (
                             <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>حدثت أخطاء</AlertTitle>
                                <AlertDescription>
                                    فشل إرسال بعض الطلبات أو جميعها. يرجى مراجعة الأخطاء أدناه.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">الطلبات الناجحة</p>
                                <p className="text-2xl font-bold">{batchResult.successCount}</p>
                            </div>
                             <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">الطلبات الفاشلة</p>
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
                               <div className="space-y-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                {batchResult.errors.map((error, i) => (
                                    <p key={i}>{error}</p>
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

    