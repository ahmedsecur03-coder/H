
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { addDoc, collection, doc, runTransaction } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import type { Deposit, User as UserType } from '@/lib/types';
import { Loader2, ArrowLeftRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function VodafoneCashTab({ settings, isLoading }: { settings: any, isLoading: boolean }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [amountInEGP, setAmountInEGP] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const usdToEgpRate = settings?.usdRate || 50;
    const vodafoneNumber = settings?.vodafoneNumber || "الرقم غير محدد";
    const amountInUSD = parseFloat(amountInEGP) / usdToEgpRate;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !phoneNumber || !amountInEGP) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء جميع الحقول.' });
            return;
        }
        if (isNaN(amountInUSD) || amountInUSD <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال مبلغ صحيح.' });
            return;
        }

        setIsSubmitting(true);

        const depositRequest: Omit<Deposit, 'id'> = {
            userId: user.uid,
            amount: amountInUSD, // Store the amount in USD
            paymentMethod: 'فودافون كاش',
            details: { phoneNumber, amountInEGP: parseFloat(amountInEGP) },
            depositDate: new Date().toISOString(),
            status: 'معلق',
        };

        try {
            const depositsColRef = collection(firestore, `users/${user.uid}/deposits`);
            await addDoc(depositsColRef, depositRequest);
            toast({
                title: 'تم استلام طلبك',
                description: 'تم إرسال طلب الإيداع الخاص بك بنجاح وهو الآن قيد المراجعة.',
            });
            setPhoneNumber('');
            setAmountInEGP('');
        } catch (error) {
             toast({ variant: 'destructive', title: 'خطأ', description: 'لم نتمكن من إرسال طلبك.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if(isLoading) {
        return <Skeleton className="h-80" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>فودافون كاش</CardTitle>
                <CardDescription>
                    قم بتحويل المبلغ المطلوب إلى الرقم <code>{vodafoneNumber}</code> ثم أدخل رقمك الذي قمت بالتحويل منه والمبلغ.
                    سعر الصرف الحالي: <strong>1 دولار أمريكي = {usdToEgpRate} جنيه مصري</strong>.
                </CardDescription>
            </CardHeader>
             <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="vf-number">رقم هاتفك</Label>
                        <Input id="vf-number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="010xxxxxxxx" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vf-amount">المبلغ المحول (بالجنيه المصري)</Label>
                        <Input id="vf-amount" value={amountInEGP} onChange={(e) => setAmountInEGP(e.target.value)} type="number" placeholder="1000" required />
                    </div>
                    {!isNaN(amountInUSD) && amountInUSD > 0 && (
                        <div className="text-sm text-muted-foreground p-2 bg-muted rounded-md text-center">
                            سيتم إضافة ≈ <span className="font-bold text-primary">{amountInUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span> إلى رصيدك بعد المراجعة.
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                         {isSubmitting ? <Loader2 className="animate-spin" /> : 'تأكيد الإيداع'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

function BinancePayTab({ settings, isLoading }: { settings: any, isLoading: boolean }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [transactionId, setTransactionId] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const binanceId = settings?.binanceId || "المعرف غير محدد";


     const handleSubmit = async (e: React.FormEvent) => {
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
        
        try {
            const depositsColRef = collection(firestore, `users/${user.uid}/deposits`);
            await addDoc(depositsColRef, depositRequest);
            toast({
                title: 'تم استلام طلبك',
                description: 'تم إرسال طلب الإيداع الخاص بك بنجاح وهو الآن قيد المراجعة.',
            });
            setTransactionId('');
            setAmount('');
        } catch(error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لم نتمكن من إرسال طلبك.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if(isLoading) {
        return <Skeleton className="h-80" />
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Binance Pay (USDT)</CardTitle>
                <CardDescription>
                    استخدم معرف Binance Pay التالي لإرسال المبلغ بعملة USDT: <code>{binanceId}</code>. ثم أدخل معرف العملية (Transaction ID).
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="binance-tx">معرف العملية (Transaction ID)</Label>
                        <Input id="binance-tx" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="123456789123456789" required/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="binance-amount">المبلغ المحول (USDT)</Label>
                        <Input id="binance-amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="50" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'تأكيد الإيداع'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

function TransferToAdBalance() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [amount, setAmount] = useState('50');
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

            toast({ title: 'نجاح!', description: `تم تحويل ${transferAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} إلى رصيد الإعلانات بنجاح.` });
            setAmount('50');
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
            {isUserLoading ? <CardContent><Skeleton className="h-40 w-full" /></CardContent> : (
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="text-sm">
                            <p className="text-muted-foreground">الرصيد الأساسي المتاح: <span className="font-bold text-foreground">${(userData?.balance ?? 0).toFixed(2)}</span></p>
                            <p className="text-muted-foreground">رصيدك الإعلاني: <span className="font-bold text-foreground">${(userData?.adBalance ?? 0).toFixed(2)}</span></p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="transfer-amount">المبلغ المراد تحويله ($)</Label>
                            <Input id="transfer-amount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="50" required min="1" />
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isSubmitting} className="w-full">
                             {isSubmitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <ArrowLeftRight className="ml-2 h-4 w-4" />}
                             تنفيذ التحويل
                        </Button>
                    </CardFooter>
                </form>
            )}
        </Card>
    )
}


export default function AddFundsPage() {
    const firestore = useFirestore();
    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settingsData, isLoading: isSettingsLoading } = useDoc(settingsDocRef);

  return (
     <div className="space-y-6 pb-8">
       <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">شحن الرصيد</h1>
            <p className="text-muted-foreground">
            اختر طريقة الدفع المناسبة لك لإضافة رصيد إلى حسابك.
            </p>
        </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <Tabs defaultValue="vodafone" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="vodafone">فودافون كاش</TabsTrigger>
                        <TabsTrigger value="binance">Binance Pay</TabsTrigger>
                    </TabsList>
                    <TabsContent value="vodafone">
                        <VodafoneCashTab settings={settingsData} isLoading={isSettingsLoading} />
                    </TabsContent>
                    <TabsContent value="binance">
                        <BinancePayTab settings={settingsData} isLoading={isSettingsLoading} />
                    </TabsContent>
                </Tabs>
            </div>
            <div className="space-y-6">
                <TransferToAdBalance />
            </div>
       </div>
    </div>
  );
}
