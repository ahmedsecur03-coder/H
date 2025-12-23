'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, runTransaction, updateDoc } from 'firebase/firestore';
import type { Campaign } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const statusVariant = {
  'نشط': 'default',
  'متوقف': 'secondary',
  'مكتمل': 'outline',
  'بانتظار المراجعة': 'destructive',
} as const;

export function CampaignActions({ campaign, forceCollectionUpdate }: { campaign: Campaign, forceCollectionUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handlePause = async () => {
        if (!firestore) return;
        setLoading(true);
        const userDocRef = doc(firestore, 'users', campaign.userId);
        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                // Calculate remaining budget
                const remainingBudget = campaign.budget - (campaign.spend || 0);

                // Refund remaining budget to user's adBalance
                if (remainingBudget > 0) {
                    const currentAdBalance = userDoc.data().adBalance ?? 0;
                    const newAdBalance = currentAdBalance + remainingBudget;
                    transaction.update(userDocRef, { adBalance: newAdBalance });
                }

                // Update campaign status to 'متوقف' and set spend to budget (as it's "finished")
                transaction.update(campaignDocRef, { status: 'متوقف', spend: campaign.budget });
            });

            toast({ title: 'نجاح', description: 'تم إيقاف الحملة وإعادة الرصيد المتبقي.' });
            forceCollectionUpdate(); // Force re-fetch
            setOpen(false);

        } catch (error: any) {
            const permissionError = new FirestorePermissionError({ path: userDocRef.path, operation: 'update' });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">تفاصيل</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إجراءات الحملة: {campaign.name}</DialogTitle>
                    <DialogDescription>
                        مراجعة تفاصيل الحملة واتخاذ الإجراء المناسب.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p><strong>المستخدم:</strong> <span className="font-mono text-xs">{campaign.userId}</span></p>
                    <p><strong>الميزانية:</strong> ${campaign.budget.toFixed(2)}</p>
                    <p><strong>المنصة:</strong> {campaign.platform}</p>
                    <p><strong>الحالة الحالية:</strong> <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></p>
                </div>
                
                <DialogFooter className="gap-2 sm:justify-end">
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                            {campaign.status === 'نشط' && (
                                <Button variant="secondary" onClick={handlePause}>إيقاف الحملة واسترداد الرصيد</Button>
                            )}
                            {campaign.status === 'متوقف' && (
                                 <p className="text-sm text-muted-foreground">تم إيقاف هذه الحملة.</p>
                            )}
                             {campaign.status === 'مكتمل' && (
                                 <p className="text-sm text-muted-foreground">اكتملت هذه الحملة.</p>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
