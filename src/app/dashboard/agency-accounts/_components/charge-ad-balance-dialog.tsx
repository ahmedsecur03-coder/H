
'use client';

import React, { useState } from 'react';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeftRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export function ChargeAdBalanceDialog({ userData, children, onActionComplete }: { userData: User, children: React.ReactNode, onActionComplete: () => void }) {
    const firestore = useFirestore();
    const { user: authUser } = useUser();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const transferAmount = parseFloat(amount);
        if (!firestore || !authUser || !transferAmount || transferAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال مبلغ صالح للتحويل.' });
            return;
        }

        if (userData.balance < transferAmount) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'رصيدك الأساسي غير كافٍ لإتمام عملية التحويل.' });
            return;
        }

        setLoading(true);

        const userDocRef = doc(firestore, 'users', authUser.uid);
        
        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");
                const currentData = userDoc.data() as User;
                if (currentData.balance < transferAmount) throw new Error("رصيدك الأساسي غير كافٍ.");
                
                transaction.update(userDocRef, {
                    balance: increment(-transferAmount),
                    adBalance: increment(transferAmount)
                });
            });

            toast({ title: 'نجاح', description: `تم تحويل ${transferAmount.toFixed(2)}$ إلى رصيد الإعلانات بنجاح.` });
            onActionComplete();
            setOpen(false);
            setAmount('');
        } catch (error: any) {
             const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'update',
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
                    <DialogTitle>تحويل إلى رصيد الإعلانات</DialogTitle>
                    <DialogDescription>
                       قم بتحويل الأموال من رصيدك الأساسي إلى رصيد الإعلانات لاستخدامه في تمويل الحملات أو شحن حسابات الوكالة.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <Alert>
                        <AlertTitle>معلومات الرصيد</AlertTitle>
                        <AlertDescription className="space-y-1">
                             <p>الرصيد الأساسي: <span className="font-bold font-mono">${userData.balance.toFixed(2)}</span></p>
                             <p>رصيد الإعلانات الحالي: <span className="font-bold font-mono">${(userData.adBalance || 0).toFixed(2)}</span></p>
                        </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                        <Label htmlFor="amount">المبلغ المراد تحويله ($)</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" max={userData.balance} />
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="animate-spin" /> : <><ArrowLeftRight className="ml-2 h-4 w-4"/>تأكيد التحويل</>}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
