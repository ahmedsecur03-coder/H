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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { addDoc, collection, doc, runTransaction } from 'firebase/firestore';

type Platform = 'Meta' | 'Google' | 'TikTok' | 'Snapchat';

const platforms: { name: Platform; title: string }[] = [
  { name: 'Meta', title: 'Meta (Facebook & Instagram)' },
  { name: 'Google', title: 'Google Ads' },
  { name: 'TikTok', title: 'TikTok Ads' },
  { name: 'Snapchat', title: 'Snapchat Ads' },
];

const ACCOUNT_COST = 40; // $40 from Ad Balance

export function BuyAccountDialog({
  userData,
  children,
  onPurchaseComplete
}: {
  userData: UserType;
  children: React.ReactNode;
  onPurchaseComplete: () => void;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<Platform | ''>('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !user || !platform) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء اختيار منصة.' });
        return;
    }
    
    if (userData.adBalance < ACCOUNT_COST) {
        toast({ variant: 'destructive', title: 'رصيد غير كافٍ', description: `تحتاج إلى ${ACCOUNT_COST}$ على الأقل في رصيدك الإعلاني لشراء حساب.` });
        return;
    }

    setLoading(true);

    const userDocRef = doc(firestore, 'users', user.uid);
    const agencyAccountsColRef = collection(firestore, `users/${user.uid}/agencyAccounts`);

    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("User does not exist.");
            }
            const currentAdBalance = userDoc.data()?.adBalance ?? 0;
            if (currentAdBalance < ACCOUNT_COST) {
                 throw new Error("رصيد الإعلانات غير كافٍ.");
            }

            // 1. Deduct cost from user's adBalance
            const newAdBalance = currentAdBalance - ACCOUNT_COST;
            transaction.update(userDocRef, { adBalance: newAdBalance });

            // 2. Create the new agency account document
            const newAccountData: Omit<AgencyAccount, 'id'> = {
                userId: user.uid,
                platform: platform,
                accountName: `${platform} Agency Account`,
                status: 'Active',
                createdAt: new Date().toISOString(),
                balance: 0,
            };
            const newAccountDocRef = doc(agencyAccountsColRef); // Auto-generate ID
            transaction.set(newAccountDocRef, newAccountData);
        });

        toast({ title: 'نجاح!', description: `تم شراء حساب ${platform} بنجاح. سيتم إرسال التفاصيل إلى بريدك الإلكتروني.` });
        onPurchaseComplete();
        setOpen(false);
        setPlatform('');
    } catch (error: any) {
        if (error.message.includes("رصيد")) {
            toast({ variant: 'destructive', title: 'فشل الشراء', description: error.message });
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
          <DialogTitle>شراء حساب إعلاني جديد</DialogTitle>
          <DialogDescription>
            اختر المنصة التي تريد شراء حساب وكالة لها. سيتم خصم ${ACCOUNT_COST}$ من رصيدك الإعلاني.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform">المنصة</Label>
            <Select name="platform" required onValueChange={(value) => setPlatform(value as Platform)} value={platform}>
              <SelectTrigger id="platform">
                <SelectValue placeholder="اختر منصة إعلانية" />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            التكلفة: <span className="font-bold text-primary">${ACCOUNT_COST.toFixed(2)}</span>. رصيدك الإعلاني الحالي: <span className="font-bold">${userData.adBalance?.toFixed(2) ?? '0.00'}</span>
          </p>
          <DialogFooter>
            <Button type="submit" disabled={loading || !platform} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'تأكيد الشراء والدفع'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}