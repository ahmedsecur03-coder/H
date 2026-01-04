
'use client';

import React, { useState } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import type { AgencyChargeRequest, AgencyAccount, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ChargeBalanceDialog({ account, userData, children, onActionComplete }: { account: AgencyAccount, userData: User, children: React.ReactNode, onActionComplete: () => void }) {
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const chargeAmount = parseFloat(amount);
        if (!firestore || !authUser || !chargeAmount || chargeAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال مبلغ صالح للشحن.' });
            return;
        }

        if ((userData.adBalance ?? 0) < chargeAmount) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'رصيد إعلاناتك غير كافٍ لإتمام عملية الشحن.' });
            return;
        }

        setLoading(true);

        const newRequest: Omit<AgencyChargeRequest, 'id'> = {
            userId: authUser.uid,
            accountId: account.accountId,
            accountName: account.accountName,
            platform: account.platform,
            amount: chargeAmount,
            requestDate: new Date().toISOString(),
            status: 'معلق',
        };

        const requestsColRef = collection(firestore, `users/${authUser.uid}/agencyChargeRequests`);

        try {
            await addDoc(requestsColRef, newRequest);
            toast({ title: 'تم استلام طلب الشحن', description: 'سيتم مراجعة طلبك وتعبئة رصيد حسابك الإعلاني قريباً.' });
            onActionComplete();
            setOpen(false);
            setAmount('');
        } catch (error) {
             const permissionError = new FirestorePermissionError({
                path: requestsColRef.path,
                operation: 'create',
                requestResourceData: newRequest
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
                    <DialogTitle>شحن رصيد حساب: {account.accountName}</DialogTitle>
                    <DialogDescription>
                        سيتم خصم المبلغ من "رصيد الإعلانات العام" وإرسال طلب للمراجعة. معرف الحساب: <span className="font-mono">{account.accountId}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                     <Alert>
                        <AlertTitle>معلومات الرصيد</AlertTitle>
                        <AlertDescription className="space-y-1">
                             <p>رصيد الإعلانات العام: <span className="font-bold font-mono">${(userData.adBalance || 0).toFixed(2)}</span></p>
                             <p>رصيد الحساب الحالي: <span className="font-bold font-mono">${account.balance.toFixed(2)}</span></p>
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label htmlFor="amount">المبلغ المراد شحنه ($)</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="5" />
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin" /> : <><Zap className="ml-2 h-4 w-4"/>تأكيد طلب الشحن</>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
