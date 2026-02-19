
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, addDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, Send, AlertTriangle, Info } from 'lucide-react';
import type { User as UserType, Deposit } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle } from '@/components/ui/alert';
import { CopyButton } from '../affiliate/_components/copy-button';
import React, { useState } from 'react';

function AddFundsSkeleton() {
    return (
         <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Card><CardContent className="p-4"><Skeleton className="h-96" /></CardContent></Card>
                </div>
                <div className="space-y-6">
                    <Card><CardContent className="p-4"><Skeleton className="h-24" /></CardContent></Card>
                </div>
           </div>
       </div>
    )
}

function DepositForm({ method, paymentInfo }: { method: 'فودافون كاش' | 'Binance Pay' | 'سرياتيل كاش', paymentInfo: string }) {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const amount = parseFloat(formData.get('amount') as string);
        const transactionId = formData.get('transactionId') as string;
        
        if (!authUser || !firestore || !amount || amount <= 0 || !transactionId) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء تعبئة جميع الحقول بشكل صحيح.' });
            return;
        }

        setIsSubmitting(true);
        
        const depositData: Omit<Deposit, 'id'> = {
            userId: authUser.uid,
            amount,
            paymentMethod: method,
            details: method === 'Binance Pay' ? { transactionId } : { senderNumber: transactionId },
            depositDate: new Date().toISOString(),
            status: 'معلق'
        };

        try {
            const depositsColRef = collection(firestore, `users/${authUser.uid}/deposits`);
            await addDoc(depositsColRef, depositData);
            toast({ title: 'تم استلام طلب الإيداع', description: 'سيتم مراجعة طلبك وإضافة الرصيد إلى حسابك قريباً.' });
            form.reset();
        } catch (error) {
            const permissionError = new FirestorePermissionError({
                path: `users/${authUser.uid}/deposits`,
                operation: 'create',
                requestResourceData: depositData
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-semibold">تعليمات هامة</AlertTitle>
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p>1. قم بتحويل المبلغ المطلوب إلى الرقم/المعرف الموضح أدناه.</p>
                    <p>2. انسخ رقم هاتفك الذي قمت بالتحويل منه أو معرف المعاملة (TxID).</p>
                    <p>3. املأ النموذج أدناه وأرسل طلبك للمراجعة.</p>
                </div>
            </Alert>

            <div className="space-y-2">
                <Label>{method === 'فودافون كاش' ? 'رقم فودافون كاش للتحويل' : method === 'سرياتيل كاش' ? 'رقم سرياتيل كاش للتحويل' : 'معرف Binance Pay للتحويل'}</Label>
                <div className="flex items-center gap-2">
                    <Input readOnly value={paymentInfo} className="font-mono text-center" />
                    <CopyButton textToCopy={paymentInfo} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor={`amount-${method}`}>المبلغ بالدولار ($)</Label>
                    <Input id={`amount-${method}`} name="amount" type="number" step="0.01" min="1" required placeholder="10" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`transactionId-${method}`}>{method === 'Binance Pay' ? 'معرف المعاملة (TxID)' : 'رقم هاتفك المحول منه'}</Label>
                    <Input id={`transactionId-${method}`} name="transactionId" required placeholder="..." />
                </div>
            </div>
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="ml-2 h-4 w-4" />}
                إرسال طلب الإيداع
            </Button>
        </form>
    );
}

export default function AddFundsPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userData, isLoading: userLoading } = useDoc<UserType>(userDocRef);
    
    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settingsData, isLoading: settingsLoading } = useDoc<any>(settingsDocRef);
    
    const isLoading = isUserLoading || userLoading || settingsLoading;

    if (isLoading || !userData) {
        return <AddFundsSkeleton />;
    }

    const vodafoneNumber = settingsData?.vodafoneNumber || 'غير متوفر حالياً';
    const binanceId = settingsData?.binanceId || 'غير متوفر حالياً';
    const syriatelNumber = settingsData?.syriatelNumber || '0931462523';

    return (
         <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">شحن الرصيد</h1>
                <p className="text-muted-foreground">
                    اختر طريقة الدفع المناسبة لك واتبع التعليمات لشحن رصيدك للبدء في طلب خدمات SMM.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Tabs defaultValue="vodafone" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="vodafone">فودافون كاش</TabsTrigger>
                            <TabsTrigger value="syriatel">سرياتيل كاش (سوريا)</TabsTrigger>
                            <TabsTrigger value="binance">Binance Pay</TabsTrigger>
                        </TabsList>
                        <Card className="mt-4">
                            <CardContent className="p-6">
                                <TabsContent value="vodafone">
                                    <DepositForm method="فودافون كاش" paymentInfo={vodafoneNumber} />
                                </TabsContent>
                                <TabsContent value="syriatel">
                                    <DepositForm method="سرياتيل كاش" paymentInfo={syriatelNumber} />
                                </TabsContent>
                                <TabsContent value="binance">
                                    <DepositForm method="Binance Pay" paymentInfo={binanceId} />
                                </TabsContent>
                            </CardContent>
                        </Card>
                    </Tabs>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">رصيدك الحالي</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">${userData?.balance.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                     <Alert variant="default" className="border-primary/50">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="font-semibold">سعر صرف الدولار</AlertTitle>
                        <div className="text-sm text-muted-foreground space-y-1 mt-2">
                            <p>السعر الحالي هو: <span className="font-bold text-foreground">{settingsData?.usdRate || 'N/A'} جنيه مصري</span> للدولار الواحد.</p>
                            <p>بالنسبة لسوريا، يرجى مراجعة الدعم لتحديد سعر الصرف المعتمد حالياً.</p>
                        </div>
                    </Alert>
                </div>
            </div>
        </div>
    );
}
