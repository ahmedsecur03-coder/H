
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, DollarSign, Users, Crown, Loader2, Target, Check, Share2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import type { User as UserType, AffiliateTransaction, Withdrawal } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import React, { useState } from 'react';
import { AFFILIATE_LEVELS } from '@/lib/service';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, collection, query, orderBy, limit, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { WhatsAppIcon } from "@/components/ui/icons";
import { Twitter, Facebook } from "lucide-react";

// Inlined CopyButton component
function CopyButton({ textToCopy }: { textToCopy: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({ title: "تم نسخ الرابط بنجاح!" });
      setTimeout(() => setCopied(false), 2000);
  };

  return (
      <Button size="icon" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
  );
}

// Inlined WithdrawalDialog component
function WithdrawalDialog({ user, children }: { user: UserType, children: React.ReactNode }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [method, setMethod] = useState<'فودافون كاش' | 'Binance Pay' | undefined>();
    const [details, setDetails] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const withdrawalAmount = parseFloat(amount);
        if (!firestore || !user || !method || !details || !withdrawalAmount) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء ملء جميع الحقول.' });
            return;
        }

        if (withdrawalAmount < 10) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الحد الأدنى للسحب هو 10$.' });
            return;
        }
        
        if ((user.affiliateEarnings ?? 0) < withdrawalAmount) {
             toast({ variant: 'destructive', title: 'خطأ', description: 'رصيد أرباحك غير كافٍ.' });
            return;
        }

        setLoading(true);

        const newWithdrawal: Omit<Withdrawal, 'id'> = {
            userId: user.id,
            amount: withdrawalAmount,
            method,
            details: method === 'فودافون كاش' ? { phoneNumber: details } : { binanceId: details },
            requestDate: new Date().toISOString(),
            status: 'معلق',
        };

        try {
            const withdrawalColRef = collection(firestore, `users/${user.id}/withdrawals`);
            await addDoc(withdrawalColRef, newWithdrawal);
            toast({ title: 'تم إرسال طلب السحب', description: 'سيتم مراجعة طلبك وإرسال أرباحك قريباً.' });
            setOpen(false);
            setAmount('');
            setDetails('');
            setMethod(undefined);
        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: `users/${user.id}/withdrawals`,
                operation: 'create',
                requestResourceData: newWithdrawal,
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>طلب سحب أرباح التسويق</DialogTitle>
                    <DialogDescription>
                        أدخل المبلغ وتفاصيل طريقة الدفع. الحد الأدنى للسحب هو 10$.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">المبلغ ($)</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="10" max={user.affiliateEarnings} />
                         <p className="text-xs text-muted-foreground">رصيدك الحالي: ${user.affiliateEarnings?.toFixed(2) ?? '0.00'}</p>
                    </div>
                     <div className="space-y-2">
                        <Label>طريقة السحب</Label>
                        <RadioGroup onValueChange={(v) => setMethod(v as any)} value={method} className="flex gap-4">
                            <Label htmlFor="vf-cash" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:border-primary flex-1 cursor-pointer">
                                <RadioGroupItem value="فودافون كاش" id="vf-cash" />
                                فودافون كاش
                            </Label>
                             <Label htmlFor="binance" className="flex items-center gap-2 border p-3 rounded-md has-[:checked]:border-primary flex-1 cursor-pointer">
                                <RadioGroupItem value="Binance Pay" id="binance" />
                                Binance Pay
                            </Label>
                        </RadioGroup>
                    </div>
                     {method && (
                         <div className="space-y-2">
                            <Label htmlFor="details">{method === 'فودافون كاش' ? 'رقم فودافون كاش' : 'معرف Binance Pay'}</Label>
                            <Input id="details" value={details} onChange={e => setDetails(e.target.value)} required placeholder={method === 'فودافون كاش' ? '01xxxxxxxxx' : '12345678'} />
                        </div>
                     )}
                     <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin" /> : 'تأكيد طلب السحب'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ShareButtons({ referralLink }: { referralLink: string }) {
    const shareText = encodeURIComponent(`انضم إلى منصة حاجاتي عبر الرابط الخاص بي واحصل على بداية قوية لرحلتك الرقمية!`);
    const encodedLink = encodeURIComponent(referralLink);

    const shareTargets = [
        { name: 'WhatsApp', icon: WhatsAppIcon, url: `https://api.whatsapp.com/send?text=${shareText}%20${encodedLink}` },
        { name: 'X', icon: Twitter, url: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedLink}` },
        { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}` },
    ];
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button size="icon" variant="outline"><Share2 className="h-4 w-4"/></Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
                <div className="flex gap-2">
                    {shareTargets.map(target => {
                        const Icon = target.icon;
                        return (
                            <Button key={target.name} size="icon" variant="ghost" asChild>
                                <a href={target.url} target="_blank" rel="noopener noreferrer">
                                    <Icon className="h-5 w-5" />
                                </a>
                            </Button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}


function AffiliateSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64 lg:col-span-1" />
                <Skeleton className="h-64 lg:col-span-2" />
            </div>
             <Skeleton className="h-64 w-full" />
        </div>
    );
}

function NetworkTree({ userData }: { userData: UserType }) {
    // Placeholder data for 5 levels. Level 1 is dynamic.
    const treeData = {
        level: 0,
        name: "أنت",
        children: [
            { level: 1, name: "دعوة مباشرة", count: userData?.referralsCount || 0 },
            { level: 2, name: "المستوى الثاني", count: 0 },
            { level: 3, name: "المستوى الثالث", count: 0 },
            { level: 4, name: "المستوى الرابع", count: 0 },
            { level: 5, name: "المستوى الخامس", count: 0 },
        ]
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>شجرة شبكتك التسويقية</CardTitle>
                <CardDescription>نظرة عامة على مستويات شبكة الإحالة الخاصة بك (حتى 5 مستويات).</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-48 overflow-x-auto">
                 <div className="flex items-center gap-2 text-center p-4">
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center border-2 border-primary">
                            <Target className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-bold">{treeData.name}</p>
                    </div>

                    {treeData.children.map((child, index) => (
                        <React.Fragment key={index}>
                            <div className="w-8 h-1 bg-border-muted-foreground/30 shrink-0"></div>
                             <div className="flex flex-col items-center gap-2 shrink-0">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-2xl font-bold">{(child.count).toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{child.name}</p>
                            </div>
                        </React.Fragment>
                    ))}
                 </div>
            </CardContent>
        </Card>
    );
}

function TransactionHistoryTable({ userId }: { userId: string }) {
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => 
        firestore ? query(collection(firestore, `users/${userId}/affiliateTransactions`), orderBy('transactionDate', 'desc'), limit(10)) : null,
        [firestore, userId]
    );
    const { data: transactions, isLoading } = useCollection<AffiliateTransaction>(transactionsQuery);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40" />
                </CardContent>
            </Card>
        );
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>سجل معاملات العمولة</CardTitle>
                <CardDescription>آخر 10 عمولات حصلت عليها من شبكتك.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>تاريخ المعاملة</TableHead>
                            <TableHead>معرف الطلب</TableHead>
                             <TableHead>المدعو</TableHead>
                             <TableHead>المستوى</TableHead>
                            <TableHead className="text-right">مبلغ العمولة</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions && transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>{new Date(tx.transactionDate).toLocaleDateString('ar-EG')}</TableCell>
                                    <TableCell className="font-mono text-xs">{tx.orderId.substring(0,10)}...</TableCell>
                                    <TableCell className="font-mono text-xs">{tx.referralId.substring(0,10)}...</TableCell>
                                    <TableCell className="text-center">{tx.level}</TableCell>
                                    <TableCell className="text-right font-medium text-green-400">+${tx.amount.toFixed(2)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">لا توجد معاملات لعرضها.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function AffiliatePage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (authUser ? doc(firestore, 'users', authUser.uid) : null), [authUser, firestore]);
    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserType>(userDocRef);

    const isLoading = isUserLoading || isUserDataLoading;

    if (isLoading || !userData) {
        return <AffiliateSkeleton />;
    }
    
    const referralLink = `https://hajaty.com/signup?ref=${userData.referralCode}`;
    const currentLevelKey = userData?.affiliateLevel || 'برونزي';
    const currentLevel = AFFILIATE_LEVELS[currentLevelKey as keyof typeof AFFILIATE_LEVELS];
    const nextLevelKey = null; // This logic needs updating to be dynamic
    const nextLevel = null;
    const referralsCount = userData?.referralsCount ?? 0;
    const progressToNextLevel = 0;

  return (
    <div className="space-y-6 pb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">برنامج الإحالة (Affiliate)</h1>
            <p className="text-muted-foreground">
              اكسب المال عن طريق دعوة أصدقائك. نظام عمولات هجين يمنحك أرباح مباشرة وشبكية.
            </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">أرباحك القابلة للسحب</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${(userData?.affiliateEarnings ?? 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">الحد الأدنى للسحب: $10.00</p>
                </CardContent>
                 <CardFooter>
                    <WithdrawalDialog user={userData}>
                       <Button className="w-full" disabled={(userData?.affiliateEarnings ?? 0) < 10}>طلب سحب الأرباح</Button>
                    </WithdrawalDialog>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي المدعوين</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{(userData?.referralsCount ?? 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">في جميع مستويات شبكتك</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">مستواك التسويقي</CardTitle>
                    <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", 
                        currentLevelKey === 'ماسي' && "text-primary",
                        currentLevelKey === 'ذهبي' && "text-yellow-400",
                        currentLevelKey === 'فضي' && "text-slate-400",
                    )}>
                        {userData?.affiliateLevel ?? 'برونزي'}
                    </div>
                    <p className="text-xs text-muted-foreground">نسبة العمولة المباشرة: {currentLevel.commission}%</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">الترقية التالية: {nextLevelKey || 'لا يوجد'}</CardTitle>
                    {nextLevel && referralsCount < 100 /* Update requirement */ ? (
                        <CardDescription>
                             ادعُ {(100 - referralsCount).toLocaleString()} شخصًا آخر للوصول للمستوى التالي.
                        </CardDescription>
                    ) : (
                         <CardDescription>
                            {nextLevel ? `لقد وصلت إلى مستوى ${nextLevelKey}!` : 'لقد وصلت إلى أعلى مستوى!'}
                         </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                     {nextLevel ? (
                        <>
                            <Progress value={progressToNextLevel} className="h-2 my-2" />
                            <p className="text-xs text-muted-foreground text-center">{(referralsCount).toLocaleString()} / {(100).toLocaleString()}</p>
                        </>
                     ) : (
                         <p className="text-sm font-medium text-center text-primary">🎉 أنت في القمة 🎉</p>
                     )}
                </CardContent>
            </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>رابط الإحالة الخاص بك</CardTitle>
                    <CardDescription>شاركه مع أصدقائك لتبدأ في كسب العمولات.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                    <Input readOnly value={referralLink} placeholder="جاري تحميل الرابط..." />
                    <CopyButton textToCopy={referralLink} />
                    <ShareButtons referralLink={referralLink} />
                </CardContent>
            </Card>
            <div className="lg:col-span-2">
                <NetworkTree userData={userData} />
            </div>
        </div>
        {authUser && <TransactionHistoryTable userId={authUser.uid} />}
    </div>
  );
}

    

    
