
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
import { Loader2, RefreshCw, DollarSign } from 'lucide-react';
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
    const [spendAmount, setSpendAmount] = useState('');


    const handleAction = async (newStatus: 'نشط' | 'متوقف') => {
        if (!firestore) return;
        setLoading(true);
        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
        updateDoc(campaignDocRef, { status: newStatus })
            .then(() => {
                toast({ title: 'نجاح', description: `تم تغيير حالة الحملة إلى ${newStatus}` });
                forceCollectionUpdate(); // Force re-fetch
                setOpen(false);
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({ path: campaignDocRef.path, operation: 'update', requestResourceData: { status: newStatus } });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setLoading(false);
            });
    };
    
    const handleReject = async () => {
        if (!firestore) return;
        setLoading(true);
        const userDocRef = doc(firestore, 'users', campaign.userId);
        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
        
        runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

            const currentAdBalance = userDoc.data().adBalance ?? 0;
            const newAdBalance = currentAdBalance + campaign.budget;
            
            transaction.update(userDocRef, { adBalance: newAdBalance });
            transaction.delete(campaignDocRef);
        }).then(() => {
            toast({ title: 'نجاح', description: 'تم رفض الحملة وإعادة الميزانية للمستخدم.' });
            forceCollectionUpdate(); // Force re-fetch
            setOpen(false);
        }).catch(error => {
             const permissionError = new FirestorePermissionError({ path: userDocRef.path, operation: 'update' });
             errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setLoading(false);
        });
    };

    const handleSimulateSpend = async () => {
        const amount = parseFloat(spendAmount);
        if (!firestore || !amount || amount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال مبلغ صحيح للمحاكاة.' });
            return;
        }

        setLoading(true);
        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
        const newSpend = (campaign.spend || 0) + amount;
        
        // Prevent spending more than the budget
        if (newSpend > campaign.budget) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'مبلغ الإنفاق يتجاوز الميزانية الإجمالية.' });
            setLoading(false);
            return;
        }

        const newStatus = newSpend >= campaign.budget ? 'مكتمل' : campaign.status;

        updateDoc(campaignDocRef, { spend: newSpend, status: newStatus })
            .then(() => {
                toast({ title: 'نجاح', description: `تمت محاكاة إنفاق ${amount}$ بنجاح.` });
                setSpendAmount('');
                forceCollectionUpdate();
                if(newStatus === 'مكتمل') setOpen(false);
            })
            .catch(error => {
                 const permissionError = new FirestorePermissionError({ path: campaignDocRef.path, operation: 'update', requestResourceData: { spend: newSpend } });
                 errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                 setLoading(false);
            });
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
                    <p><strong>الميزانية / الإنفاق:</strong> ${campaign.budget.toFixed(2)} / <span className="text-destructive">${(campaign.spend || 0).toFixed(2)}</span></p>
                    <p><strong>المنصة:</strong> {campaign.platform}</p>
                    <p><strong>الحالة الحالية:</strong> <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></p>

                    {campaign.status === 'نشط' && (
                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="spend-simulation">محاكاة الإنفاق</Label>
                             <div className="flex gap-2">
                                <Input 
                                    id="spend-simulation"
                                    type="number"
                                    value={spendAmount}
                                    onChange={(e) => setSpendAmount(e.target.value)}
                                    placeholder="أدخل مبلغ الإنفاق"
                                    disabled={loading}
                                />
                                <Button onClick={handleSimulateSpend} disabled={loading}>
                                     {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                </Button>
                             </div>
                             <p className="text-xs text-muted-foreground">أضف مبلغًا إلى خانة "الإنفاق" لمحاكاة أداء الحملة.</p>
                        </div>
                    )}
                </div>
                
                <DialogFooter className="gap-2 sm:justify-between">
                    <div className="flex gap-2">
                         {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                {campaign.status === 'بانتظار المراجعة' && (
                                    <>
                                        <Button variant="destructive" onClick={handleReject}>رفض الحملة</Button>
                                        <Button onClick={() => handleAction('نشط')}>موافقة وتفعيل</Button>
                                    </>
                                )}
                                {campaign.status === 'نشط' && (
                                    <Button variant="secondary" onClick={() => handleAction('متوقف')}>إيقاف مؤقت</Button>
                                )}
                                {campaign.status === 'متوقف' && campaign.spend < campaign.budget && (
                                    <Button onClick={() => handleAction('نشط')}>إعادة تفعيل</Button>
                                )}
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
