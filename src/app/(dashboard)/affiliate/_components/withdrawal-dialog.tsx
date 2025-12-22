

'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import type { Withdrawal, User as UserType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { requestWithdrawal } from '../actions';

export function WithdrawalDialog({ children, user }: { children: React.ReactNode; user: UserType }) {
    const { user: authUser } = useUser();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'فودافون كاش' | 'Binance Pay'>('فودافون كاش');
    const [details, setDetails] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authUser) return;

        const withdrawalAmount = parseFloat(amount);
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال مبلغ صحيح للسحب.' });
            return;
        }

        if (withdrawalAmount < 10) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الحد الأدنى للسحب هو 10 دولارات.' });
            return;
        }
        
        if (!user.affiliateEarnings || user.affiliateEarnings < withdrawalAmount) {
             toast({ variant: 'destructive', title: 'رصيد غير كافٍ', description: 'أرباحك القابلة للسحب لا تكفي لإتمام هذا الطلب.' });
            return;
        }

        if (!details.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال تفاصيل الدفع.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await requestWithdrawal({
                amount: withdrawalAmount,
                method,
                details: method === 'فودافون كاش' ? { phoneNumber: details } : { binanceId: details },
            });

            toast({ title: 'تم استلام طلبك', description: 'سيتم مراجعة طلب السحب الخاص بك في أقرب وقت.' });
            setOpen(false);
            setAmount('');
            setDetails('');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>طلب سحب الأرباح</DialogTitle>
          <DialogDescription>
            أرباحك المتاحة: <span className="font-bold text-primary">${(user.affiliateEarnings ?? 0).toFixed(2)}</span>. الحد الأدنى للسحب هو $10.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ ($)</Label>
                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 50" required />
                </div>
                 <Tabs defaultValue="فودافون كاش" onValueChange={(value) => setMethod(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="فودافون كاش">فودافون كاش</TabsTrigger>
                        <TabsTrigger value="Binance Pay">Binance Pay</TabsTrigger>
                    </TabsList>
                    <TabsContent value="فودافون كاش">
                         <div className="space-y-2 pt-4">
                            <Label htmlFor="vf-details">رقم فودافون كاش</Label>
                            <Input id="vf-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="010xxxxxxxx" required={method === 'فودافون كاش'} />
                        </div>
                    </TabsContent>
                    <TabsContent value="Binance Pay">
                         <div className="space-y-2 pt-4">
                            <Label htmlFor="binance-details">معرف Binance Pay</Label>
                            <Input id="binance-details" value={details} onChange={(e) => setDetails(e.target.value)} placeholder="123456789" required={method === 'Binance Pay'} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'إرسال الطلب'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
