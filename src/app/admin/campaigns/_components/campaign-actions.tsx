
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


    const handleSimulateSpend = async () => {
        const amount = parseFloat(spendAmount);
        if (!firestore || !amount || amount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال مبلغ صحيح للمحاكاة.' });
            return;
        }

        setLoading(true);
        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
        const newSpend = (campaign.spend || 0) + amount;
        
        if (newSpend > campaign.budget) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'مبلغ الإنفاق يتجاوز الميزانية الإجمالية.' });
            setLoading(false);
            return;
        }

        const newStatus = newSpend >= campaign.budget ? 'مكتمل' : campaign.status;

        // Simulate results based on spend
        const clicks = (campaign.clicks || 0) + Math.floor(amount * (Math.random() * 10 + 5)); // 5-15 clicks per dollar
        const impressions = (campaign.impressions || 0) + Math.floor(amount * (Math.random() * 2000 + 1000)); // 1000-3000 impressions per dollar
        const results = (campaign.results || 0) + Math.floor(amount * (Math.random() * 3 + 1)); // 1-4 results per dollar
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpc = clicks > 0 ? newSpend / clicks : 0;


        const updates = { 
            spend: newSpend, 
            status: newStatus,
            impressions,
            clicks,
            results,
            ctr,
            cpc
        };

        updateDoc(campaignDocRef, updates)
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
    
    const handleApprove = async () => {
        if (!firestore) return;
        setLoading(true);
        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
        updateDoc(campaignDocRef, { status: 'نشط' })
            .then(() => {
                toast({ title: 'نجاح', description: 'تم تفعيل الحملة بنجاح.' });
                forceCollectionUpdate();
                setOpen(false);
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({ path: campaignDocRef.path, operation: 'update', requestResourceData: { status: 'نشط' } });
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
                    <div className="flex items-center gap-2"><strong>الحالة الحالية:</strong> <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></div>

                     {campaign.status === 'بانتظار المراجعة' && (
                         <div className="pt-4 border-t">
                            <Button onClick={handleApprove} disabled={loading} className="w-full">
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'الموافقة على الحملة وتفعيلها'}
                            </Button>
                         </div>
                    )}

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
                                <Button onClick={handleSimulateSpend} disabled={loading || !spendAmount}>
                                     {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                </Button>
                             </div>
                             <p className="text-xs text-muted-foreground">أضف مبلغًا إلى خانة "الإنفاق" لمحاكاة أداء الحملة وتوليد نتائج.</p>
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

    