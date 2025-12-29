
'use client';

import { useState } from 'react';
import type { AgencyAccount, User as UserType, AgencyChargeRequest } from '@/lib/types';
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
import { addDoc, collection, doc } from 'firebase/firestore';

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

    const chargeRequestData: Omit<AgencyChargeRequest, 'id'> = {
        userId: user.uid,
        accountId: account.id,
        accountName: account.accountName,
        platform: account.platform,
        amount: chargeAmount,
        requestDate: new Date().toISOString(),
        status: 'معلق'
    };

    const requestsColRef = collection(firestore, `users/${user.uid}/agencyChargeRequests`);
    
    try {
        await addDoc(requestsColRef, chargeRequestData);
        toast({ title: 'تم إرسال طلب الشحن', description: 'سيقوم المسؤول بمراجعة طلبك وتأكيده قريبًا.' });
        onChargeComplete();
        setOpen(false);
        setAmount('');
    } catch(error) {
        const permissionError = new FirestorePermissionError({ 
            path: requestsColRef.path, 
            operation: 'create',
            requestResourceData: chargeRequestData
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
          <DialogTitle>شحن رصيد: {account.accountName}</DialogTitle>
          <DialogDescription>
            أدخل المبلغ المراد تحويله من رصيد إعلاناتك العام إلى هذا الحساب. سيتم إرسال الطلب للمراجعة.
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
              {loading ? <Loader2 className="animate-spin" /> : 'إرسال طلب الشحن'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
