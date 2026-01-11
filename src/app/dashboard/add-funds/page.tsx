'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { runTransaction, doc, collection, query, where, increment } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, DollarSign } from 'lucide-react';
import type { User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function AddFundsPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
    const { data: userData, isLoading: userLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

    const [amount, setAmount] = useState('10');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const depositAmount = parseFloat(amount);
        if (!authUser || !firestore || !depositAmount || depositAmount < 5) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال مبلغ صالح. الحد الأدنى هو 5$.' });
            return;
        }

        setIsSubmitting(true);
        toast({ title: 'جاري معالجة الدفع...', description: 'يرجى الانتظار.' });
        
        const userRef = doc(firestore, 'users', authUser.uid);
        const today = new Date().toISOString().split('T')[0];
        const dailyStatRef = doc(firestore, 'dailyStats', today);

        // Simulate a short delay for payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                // Main user balance update
                transaction.update(userRef, {
                    balance: increment(depositAmount),
                    totalSpent: increment(depositAmount)
                });
                
                // Aggregate daily stats
                transaction.set(dailyStatRef, {
                    totalRevenue: increment(depositAmount)
                }, { merge: true });

            });

            forceDocUpdate();
            toast({
                title: 'تم شحن الرصيد بنجاح!',
                description: `تمت إضافة ${depositAmount.toFixed(2)}$ إلى رصيدك.`,
            });
            setAmount('10'); // Reset to default

        } catch (error: any) {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (userLoading || !userData) {
        return <AddFundsSkeleton />;
    }

    return (
         <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">شحن الرصيد</h1>
                <p className="text-muted-foreground">
                    أضف رصيدًا إلى حسابك فورًا باستخدام بطاقتك الائتمانية.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <form onSubmit={handleSubmit}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-6 w-6 text-primary" />
                                    الدفع الآمن بالبطاقة
                                </CardTitle>
                                <CardDescription>
                                    جميع المعاملات مؤمنة ومشفرة.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="amount-usd">المبلغ بالدولار الأمريكي ($)</Label>
                                    <Input 
                                        id="amount-usd" 
                                        type="number" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)} 
                                        placeholder="أدخل المبلغ" 
                                        required 
                                        min="5"
                                        className="text-lg h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>تفاصيل البطاقة (بيانات وهمية للمحاكاة)</Label>
                                    <div className="p-3 border rounded-md bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                                            <Input className="border-none bg-transparent focus-visible:ring-0 p-0 text-base" defaultValue="4242 4242 4242 4242" readOnly />
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-2 gap-4">
                                          <div className="p-3 border rounded-md bg-muted/50">
                                            <Input className="border-none bg-transparent focus-visible:ring-0 p-0 text-base" defaultValue="12/28" readOnly />
                                        </div>
                                         <div className="p-3 border rounded-md bg-muted/50">
                                            <Input className="border-none bg-transparent focus-visible:ring-0 p-0 text-base" defaultValue="123" readOnly />
                                        </div>
                                     </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : `ادفع الآن ${parseFloat(amount) > 0 ? '$'+parseFloat(amount).toFixed(2) : ''}`}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">رصيدك الأساسي</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">${userData?.balance.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
