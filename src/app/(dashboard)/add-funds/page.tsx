'use client';

import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, runTransaction, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import type { Deposit, User as UserType } from '@/lib/types';
import { Loader2, ArrowLeftRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function VodafoneCashTab() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !phoneNumber || !amount) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول.' });
            return;
        }
        setIsSubmitting(true);

        const depositRequest: Omit<Deposit, 'id'> = {
            userId: user.uid,
            amount: parseFloat(amount),
            paymentMethod: 'فودافون كاش',
            details: { phoneNumber },
            depositDate: new Date().toISOString(),
            status: 'معلق',
        };

        const depositsColRef = collection(firestore, `users/${user.uid}/deposits`);
        addDocumentNonBlocking(depositsColRef, depositRequest);

        toast({
            title: 'تم استلام طلبك',
            description: 'تم إرسال طلب الإيداع الخاص بك بنجاح وهو الآن قيد المراجعة.',
        });

        setPhoneNumber('');
        setAmount('');
        setIsSubmitting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>فودافون كاش</CardTitle>
                <CardDescription>
                    قم بتحويل المبلغ المطلوب إلى الرقم <code>01012345678</code> ثم أدخل رقمك الذي قمت بالتحويل منه والمبلغ.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="vf-number">رقم هاتفك</Label>
                        <Input id="vf-number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="010xxxxxxxx" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vf-amount">المبلغ المحول (بالجنيه المصري)</Label>
                        <Input id="vf-amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="100" required />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                         {isSubmitting ? <Loader2 className="animate-spin" /> : 'تأكيد الإيداع'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function BinancePayTab() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !transactionId || !amount) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول.' });
            return;
        }
        setIsSubmitting(true);

        const depositRequest: Omit<Deposit, 'id'> = {
            userId: user.uid,
            amount: parseFloat(amount),
            paymentMethod: 'Binance Pay',
            details: { transactionId },
            depositDate: new Date().toISOString(),
            status: 'معلق',
        };

        const depositsColRef = collection(firestore, `users/${user.uid}/deposits`);
        addDocumentNonBlocking(depositsColRef, depositRequest);

        toast({
            title: 'تم استلام طلبك',
            description: 'تم إرسال طلب الإيداع الخاص بك بنجاح وهو الآن قيد المراجعة.',
        });

        setTransactionId('');
        setAmount('');
        setIsSubmitting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Binance Pay</CardTitle>
                <CardDescription>
                    استخدم معرف Binance Pay التالي لإرسال المبلغ (USDT): <code>USER12345</code>. ثم أدخل معرف العملية (Transaction ID).
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="binance-tx">معرف العملية (Transaction ID)</Label>
                        <Input id="binance-tx" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="123456789123456789" required/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="binance-amount">المبلغ المحول (USDT)</Label>
                        <Input id="binance-amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="50" required />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'تأكيد الإيداع'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function TransferToAdBalance() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData, isLoading: isUserLoading } = useDoc<UserType>(userDocRef);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const transferAmount = parseFloat(amount);
        if (!firestore || !authUser || !userDocRef || !userData || !transferAmount || transferAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال مبلغ صحيح للتحويل.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                const currentBalance = userDoc.data().balance ?? 0;
                if (currentBalance < transferAmount) {
                    throw new Error("رصيدك الأساسي غير كافٍ لإتمام عملية التحويل.");
                }

                const newBalance = currentBalance - transferAmount;
                const newAdBalance = (userDoc.data().adBalance ?? 0) + transferAmount;

                transaction.update(userDocRef, { balance: newBalance, adBalance: newAdBalance });
            });

            toast({ title: 'نجاح!', description: `تم تحويل ${transferAmount}$ إلى رصيد الإعلانات بنجاح.` });
            setAmount('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل التحويل', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>تحويل إلى رصيد الإعلانات</CardTitle>
                <CardDescription>
                    انقل الأموال من رصيدك الأساسي إلى رصيد الإعلانات لتمويل حملاتك.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isUserLoading ? <Skeleton className="h-24 w-full" /> : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-3 rounded-md bg-muted text-muted-foreground text-sm space-y-1">
                            <p><strong>الرصيد الأساسي:</strong> ${(userData?.balance ?? 0).toFixed(2)}</p>
                            <p><strong>رصيد الإعلانات:</strong> ${(userData?.adBalance ?? 0).toFixed(2)}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transfer-amount">المبلغ المراد تحويله</Label>
                            <Input id="transfer-amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="50" required />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                             {isSubmitting ? <Loader2 className="animate-spin" /> : <ArrowLeftRight className="ml-2 h-4 w-4" />}
                             تنفيذ التحويل
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}


export default function AddFundsPage() {
  return (
     <div className="space-y-6 pb-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">شحن الرصيد</h1>
        <p className="text-muted-foreground">
          اختر طريقة الدفع المناسبة لك لإضافة رصيد إلى حسابك أو قم بالتحويل لرصيد الإعلانات.
        </p>
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Tabs defaultValue="vodafone" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="vodafone">فودافون كاش</TabsTrigger>
                        <TabsTrigger value="binance">Binance Pay</TabsTrigger>
                    </TabsList>
                    <TabsContent value="vodafone">
                        <VodafoneCashTab />
                    </TabsContent>
                    <TabsContent value="binance">
                        <BinancePayTab />
                    </TabsContent>
                </Tabs>
            </div>
            <div>
                <TransferToAdBalance />
            </div>
       </div>
    </div>
  );
}
