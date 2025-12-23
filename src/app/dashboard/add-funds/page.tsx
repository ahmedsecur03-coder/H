'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError, useCollection } from '@/firebase';
import { runTransaction, doc, addDoc, collection, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, Clock } from 'lucide-react';
import type { Deposit, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


function CopyButton({ textToCopy }: { textToCopy: string }) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);
  
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast({ title: "تم نسخ النص بنجاح!" });
        setTimeout(() => setCopied(false), 2000);
    };
  
    return (
        <Button size="icon" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
    );
}

function AddFundsSkeleton() {
    return (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <Card><CardContent className="p-4"><Skeleton className="h-96" /></CardContent></Card>
            </div>
            <div className="space-y-6">
                <Card><CardContent className="p-4"><Skeleton className="h-24" /></CardContent></Card>
                <Card><CardContent className="p-4"><Skeleton className="h-40" /></CardContent></Card>
            </div>
       </div>
    )
}

export default function AddFundsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userData, isLoading: userLoading } = useDoc<UserType>(userDocRef);

    const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
    const { data: settingsData, isLoading: settingsLoading } = useDoc<any>(settingsDocRef);
    
    const depositsQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, `users/${user.uid}/deposits`), where('status', '==', 'معلق')) : null,
        [user, firestore]
    );
    const { data: pendingDeposits, isLoading: depositsLoading } = useCollection<Deposit>(depositsQuery);

    const [amount, setAmount] = useState('');
    const [phone, setPhone] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [binanceTxId, setBinanceTxId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const hasPendingDeposit = useMemo(() => (pendingDeposits?.length ?? 0) > 0, [pendingDeposits]);

    const calculatedAmountEGP = useMemo(() => {
        if (!settingsData) return 0;
        const usdAmount = parseFloat(amount);
        const rate = parseFloat(settingsData.usdRate);
        if (isNaN(usdAmount) || isNaN(rate) || usdAmount <= 0) {
            return 0;
        }
        return usdAmount * rate;
    }, [amount, settingsData]);

    const handleSubmit = async (e: React.FormEvent, method: 'فودافون كاش' | 'Binance Pay') => {
        e.preventDefault();
        const depositAmount = parseFloat(amount);
        if (!user || !firestore || !depositAmount || depositAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال مبلغ صالح.' });
            return;
        }
        if (method === 'فودافون كاش' && (!phone || !transactionId)) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء حقلي رقم الهاتف ورقم المعاملة.' });
            return;
        }
         if (method === 'Binance Pay' && !binanceTxId) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى ملء حقل معرف المعاملة الخاص بـ Binance.' });
            return;
        }

        setIsSubmitting(true);

        const newDeposit: Omit<Deposit, 'id'> = {
            userId: user.uid,
            amount: depositAmount,
            paymentMethod: method,
            details: method === 'فودافون كاش' ? { phoneNumber: phone, transactionId } : { transactionId: binanceTxId },
            depositDate: new Date().toISOString(),
            status: 'معلق',
        };

        const depositsColRef = collection(firestore, `users/${user.uid}/deposits`);
        addDoc(depositsColRef, newDeposit)
            .then(() => {
                toast({
                    title: 'تم استلام طلبك بنجاح!',
                    description: 'سيتم مراجعة طلب الإيداع الخاص بك وإضافة الرصيد في أقرب وقت.',
                });
                setAmount('');
                setPhone('');
                setTransactionId('');
                setBinanceTxId('');
            })
            .catch(serverError => {
                 const permissionError = new FirestorePermissionError({
                    path: depositsColRef.path,
                    operation: 'create',
                    requestResourceData: newDeposit,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };
    
    if (userLoading || settingsLoading || depositsLoading || !userData || !settingsData) {
        return (
            <div className="space-y-6 pb-8">
                <div>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-5 w-2/3 mt-2" />
                </div>
                <AddFundsSkeleton />
            </div>
        );
    }

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
                            <Card>
                                <form onSubmit={(e) => handleSubmit(e, 'فودافون كاش')}>
                                    <CardHeader>
                                        <CardTitle>الدفع عبر فودافون كاش</CardTitle>
                                        <CardDescription>
                                            لإضافة الرصيد، قم بتحويل المبلغ المطلوب إلى الرقم أدناه ثم أدخل بيانات التحويل.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Alert>
                                            <AlertTitle className="flex items-center gap-2">خطوات التحويل</AlertTitle>
                                            <AlertDescription>
                                                <ol className="list-decimal list-inside space-y-1 mt-2">
                                                    <li>اطلب <code className="font-mono bg-muted p-1 rounded-md text-sm">*9*7#</code> من هاتفك.</li>
                                                    <li>اختر "تحويل أموال" وأدخل الرقم <strong>{settingsData.vodafoneNumber}</strong>.</li>
                                                    <li>أدخل المبلغ بالجنيه المصري (EGP).</li>
                                                    <li>أدخل الرقم السري لتأكيد العملية.</li>
                                                    <li>بعد التحويل، املأ الحقول أدناه.</li>
                                                </ol>
                                            </AlertDescription>
                                        </Alert>
                                        <div className="flex items-center gap-2">
                                            <Input readOnly value={settingsData.vodafoneNumber} className="font-mono text-lg tracking-widest"/>
                                            <CopyButton textToCopy={settingsData.vodafoneNumber} />
                                        </div>
                                        <div>
                                            <Label htmlFor="amount-usd-vf">المبلغ بالدولار ($)</Label>
                                            <Input id="amount-usd-vf" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثال: 10" required />
                                        </div>
                                        <div className="p-4 bg-muted rounded-md text-center">
                                            <p className="text-sm text-muted-foreground">المبلغ المطلوب تحويله بالجنيه المصري (EGP)</p>
                                            <p className="text-2xl font-bold font-mono">{calculatedAmountEGP.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground mt-1">سعر الصرف: 1$ = {settingsData.usdRate} جنيه</p>
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">رقم هاتفك الذي تم التحويل منه</Label>
                                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" required />
                                        </div>
                                        <div>
                                            <Label htmlFor="transactionId">آخر 4 أرقام من رقم المعاملة (اختياري)</Label>
                                            <Input id="transactionId" type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="1234" />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit" disabled={isSubmitting || hasPendingDeposit} className="w-full">
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : hasPendingDeposit ? <><Clock className="ml-2"/>لديك طلب قيد المراجعة</> : 'تأكيد الإيداع'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>
                        <TabsContent value="binance">
                            <Card>
                                <form onSubmit={(e) => handleSubmit(e, 'Binance Pay')}>
                                    <CardHeader>
                                        <CardTitle>الدفع عبر Binance Pay</CardTitle>
                                        <CardDescription>
                                            لإضافة الرصيد، قم بتحويل مبلغ USDT المطلوب إلى معرف Binance Pay أدناه.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Input readOnly value={settingsData.binanceId} className="font-mono text-lg tracking-widest"/>
                                            <CopyButton textToCopy={settingsData.binanceId} />
                                        </div>
                                        <div>
                                            <Label htmlFor="amount-usdt">المبلغ بالدولار (USDT)</Label>
                                            <Input id="amount-usdt" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثال: 10" required />
                                        </div>
                                        <div>
                                            <Label htmlFor="binance-txid">معرف المعاملة (Transaction ID)</Label>
                                            <Input id="binance-txid" type="text" value={binanceTxId} onChange={(e) => setBinanceTxId(e.target.value)} placeholder="M123456789..." required />
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit" disabled={isSubmitting || hasPendingDeposit} className="w-full">
                                             {isSubmitting ? <Loader2 className="animate-spin" /> : hasPendingDeposit ? <><Clock className="ml-2"/>لديك طلب قيد المراجعة</> : 'تأكيد الإيداع'}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>رصيدك الحالي</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold">${userData?.balance.toFixed(2)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>تعليمات هامة</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>• يتم مراجعة طلبات الإيداع يدويًا وقد تستغرق بعض الوقت.</p>
                        <p>• تأكد من إدخال البيانات بشكل صحيح لتجنب تأخير إضافة الرصيد.</p>
                        <p>• الحد الأدنى للإيداع هو 5$.</p>
                        <p>• في حال وجود أي مشكلة، تواصل مع الدعم الفني فورًا.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
