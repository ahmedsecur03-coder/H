
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import type { Campaign, AgencyAccount } from '@/lib/types';
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
import { Loader2, RefreshCw, DollarSign, Clock } from 'lucide-react';
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

    const handleApprove = async () => {
        if (!firestore) return;
        setLoading(true);

        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
        const agencyAccountDocRef = doc(firestore, `users/${campaign.userId}/agencyAccounts`, campaign.agencyAccountId);

        try {
            await runTransaction(firestore, async (transaction) => {
                const agencyAccountDoc = await transaction.get(agencyAccountDocRef);
                if (!agencyAccountDoc.exists()) {
                    throw new Error("الحساب الإعلاني المرتبط بالحملة غير موجود.");
                }

                const accountData = agencyAccountDoc.data() as AgencyAccount;
                const currentAccountBalance = accountData.balance ?? 0;

                if (currentAccountBalance < campaign.budget) {
                    throw new Error(`رصيد الحساب الإعلاني غير كافٍ. المطلوب: $${campaign.budget.toFixed(2)}, المتاح: $${currentAccountBalance.toFixed(2)}`);
                }

                // 1. Deduct budget from agency account balance
                const newAccountBalance = currentAccountBalance - campaign.budget;
                transaction.update(agencyAccountDocRef, { balance: newAccountBalance });

                // 2. Activate the campaign
                const updates = { 
                    status: 'نشط' as const,
                    startDate: new Date().toISOString(),
                };
                transaction.update(campaignDocRef, updates);
            });

            toast({ title: 'نجاح', description: 'تم تفعيل الحملة وخصم الميزانية من الحساب الإعلاني بنجاح.' });
            forceCollectionUpdate();
            setOpen(false);

        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'فشل تفعيل الحملة',
                description: error.message,
            });
            const permissionError = new FirestorePermissionError({
              path: agencyAccountDocRef.path, 
              operation: 'update',
            });
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
                     <p><strong>الحساب الإعلاني:</strong> <span className="font-mono text-xs">{campaign.agencyAccountId}</span></p>
                    <p><strong>الميزانية:</strong> ${campaign.budget.toFixed(2)}</p>
                     <p className="flex items-center gap-2"><strong>المدة:</strong> {campaign.durationDays} أيام <Clock className="w-4 h-4 text-muted-foreground" /></p>
                    <p><strong>المنصة:</strong> {campaign.platform}</p>
                    <div className="flex items-center gap-2"><strong>الحالة الحالية:</strong> <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></div>

                     {campaign.status === 'بانتظار المراجعة' && (
                         <div className="pt-4 border-t">
                            <Button onClick={handleApprove} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'الموافقة على الحملة وتفعيلها'}
                            </Button>
                         </div>
                    )}
                </div>
                
                 <DialogFooter className="gap-2 sm:justify-end">
                     {loading ? <Loader2 className="animate-spin" /> : (
                         <Button variant="secondary" onClick={() => setOpen(false)}>إغلاق</Button>
                     )}
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
