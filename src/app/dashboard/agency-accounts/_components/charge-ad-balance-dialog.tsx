'use client';

import { useState } from 'react';
import type { User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap } from 'lucide-react';
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
import { doc, runTransaction, increment } from 'firebase/firestore';

const BONUS_PERCENTAGE = 0.25; // 25% bonus

export function ChargeAdBalanceDialog({
  userData,
  children,
  onActionComplete,
}: {
  userData: UserType;
  children: React.ReactNode;
  onActionComplete: () => void;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleTransfer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const transferAmount = parseFloat(amount);
    if (!firestore || !user || !transferAmount || transferAmount <= 0) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال مبلغ صحيح للتحويل.' });
      return;
    }

    if (userData.balance < transferAmount) {
      toast({ variant: 'destructive', title: 'رصيد غير كافٍ', description: `رصيدك الأساسي (${userData.balance.toFixed(2)}$) غير كافٍ.` });
      return;
    }

    setLoading(true);

    const userDocRef = doc(firestore, 'users', user.uid);
    const bonusAmount = transferAmount * BONUS_PERCENTAGE;
    const totalAdCredit = transferAmount + bonusAmount;

    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('User does not exist.');
        }
        const currentData = userDoc.data() as UserType;
        if (currentData.balance < transferAmount) {
          throw new Error('رصيدك الأساسي غير كافٍ لإتمام العملية.');
        }

        // Perform writes after read
        transaction.update(userDocRef, {
          balance: increment(-transferAmount),
          adBalance: increment(totalAdCredit),
        });
      });

      toast({
        title: '🎉 نجاح!',
        description: `تم تحويل ${transferAmount.toFixed(2)}$ من رصيدك الأساسي وإضافة ${totalAdCredit.toFixed(2)}$ إلى رصيد إعلاناتك.`,
      });
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
  
  const transferAmountNum = parseFloat(amount) || 0;
  const bonus = transferAmountNum * BONUS_PERCENTAGE;
  const totalReceived = transferAmountNum + bonus;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>شحن رصيد الإعلانات</DialogTitle>
          <DialogDescription>
            حوّل من رصيدك الأساسي إلى رصيد الإعلانات واحصل على مكافأة 25% فورية على المبلغ المحوّل.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleTransfer} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">المبلغ المراد تحويله ($)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              max={userData.balance}
              placeholder="e.g., 100"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            رصيدك الأساسي الحالي: <span className="font-bold">${userData.balance?.toFixed(2) ?? '0.00'}</span>
          </p>
          {transferAmountNum > 0 && (
             <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center space-y-2">
                 <p className="text-sm">ستحصل على مكافأة <span className="font-bold text-primary">${bonus.toFixed(2)}</span></p>
                <p className="text-lg">إجمالي المبلغ الذي سيضاف لرصيد إعلاناتك:</p>
                <p className="text-3xl font-bold text-primary">${totalReceived.toFixed(2)}</p>
             </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading || !amount || parseFloat(amount) <= 0} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'تأكيد التحويل'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
