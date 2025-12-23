
'use client';

import { useState } from 'react';
import type { AgencyAccount, User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';

export function ChargeAccountDialog({
  account,
  userData,
  children,
  onChargeComplete
}: {
  account: AgencyAccount;
  userData: UserType;
  children: React.ReactNode;
  onChargeComplete: () => void;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const chargeAmount = parseFloat(amount);
    if (!firestore || !user || !chargeAmount || chargeAmount <= 0) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال مبلغ صحيح للشحن.' });
        return;
    }
    
    if (userData.adBalance < chargeAmount) {
        toast({ variant: 'destructive', title: 'رصيد غير كافٍ', description: `رصيد إعلاناتك (${userData.adBalance.toFixed(2)}$) غير كافٍ.` });
        return;
    }

    setLoading(true);

    const userDocRef = doc(firestore, 'users', user.uid);
    const agencyAccountDocRef = doc(firestore, `users/${user.uid}/agencyAccounts`, account.id);

    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const agencyAccDoc = await transaction.get(agencyAccountDocRef);

            if (!userDoc.exists() || !agencyAccDoc.exists()) {
                throw new Error("User or Agency Account not found.");
            }

            const currentAdBalance = userDoc.data()?.adBalance ?? 0;
            if (currentAdBalance < chargeAmount) {
                 throw new Error("رصيد الإعلانات غير كافٍ.");
            }
            const currentAccountBalance = agencyAccDoc.data()?.balance ?? 0;

            // 1. Deduct amount from user's adBalance
            const newAdBalance = currentAdBalance - chargeAmount;
            transaction.update(userDocRef, { adBalance: newAdBalance });

            // 2. Add amount to agency account's balance
            const newAccountBalance = currentAccountBalance + chargeAmount;
            transaction.update(agencyAccountDocRef, { balance: newAccountBalance });
        });

        toast({ title: 'نجاح!', description: `تم شحن حساب ${account.accountName} بمبلغ ${chargeAmount}$.` });
        onChargeComplete();
        setOpen(false);
        setAmount('');
    } catch (error: any) {
        if (error.message.includes("رصيد")) {
            toast({ variant: 'destructive', title: 'فشل الشحن', description: error.message });
        } else {
            const permissionError = new FirestorePermissionError({ 
                path: `users/${user.uid}`, 
                operation: 'update',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>شحن رصيد: {account.accountName}</DialogTitle>
          <DialogDescription>
            أدخل المبلغ المراد تحويله من رصيد إعلاناتك العام إلى هذا الحساب.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ ($)</Label>
            <Input 
                id="amount" 
                name="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            رصيدك الإعلاني الحالي: <span className="font-bold">${userData.adBalance?.toFixed(2) ?? '0.00'}</span>
          </p>
          <DialogFooter>
            <Button type="submit" disabled={loading || !amount} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'تأكيد الشحن'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    