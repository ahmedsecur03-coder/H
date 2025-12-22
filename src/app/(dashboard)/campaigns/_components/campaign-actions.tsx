'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, runTransaction, updateDoc } from 'firebase/firestore';
import type { Campaign } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { simulateCampaignPerformance } from '@/ai/flows/campaign-simulation-flow';
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
    const [simulating, setSimulating] = useState(false);
    const [open, setOpen] = useState(false);
    const [dailySpend, setDailySpend] = useState('10'); // Default daily spend for simulation

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

    const handleSimulation = async () => {
        if (!firestore) return;
        setSimulating(true);

        const dailySpendAmount = parseFloat(dailySpend);
        if (isNaN(dailySpendAmount) || dailySpendAmount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الرجاء إدخال قيمة إنفاق يومي صالحة.' });
            setSimulating(false);
            return;
        }

        const remainingBudget = campaign.budget - campaign.spend;
        if(remainingBudget <= 0) {
             toast({ variant: 'destructive', title: 'تنبيه', description: 'ميزانية الحملة قد استنفدت بالفعل.' });
             const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
             updateDoc(campaignDocRef, { status: "مكتمل" });
             forceCollectionUpdate();
             setSimulating(false);
             return;
        }

        try {
            const { simulatedSpend, simulatedImpressions, simulatedClicks, simulatedResults } = await simulateCampaignPerformance({
                campaignName: campaign.name,
                platform: campaign.platform,
                goal: campaign.goal,
                remainingBudget: remainingBudget,
                dailySpend: dailySpendAmount,
            });

            const newSpend = (campaign.spend || 0) + simulatedSpend;
            const newImpressions = (campaign.impressions || 0) + simulatedImpressions;
            const newClicks = (campaign.clicks || 0) + simulatedClicks;
            const newResults = (campaign.results || 0) + simulatedResults;
            const newStatus = newSpend >= campaign.budget ? 'مكتمل' : campaign.status;

            const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
            const updateData = {
                spend: newSpend,
                impressions: newImpressions,
                clicks: newClicks,
                results: newResults,
                ctr: newImpressions > 0 ? (newClicks / newImpressions) * 100 : 0,
                cpc: newClicks > 0 ? newSpend / newClicks : 0,
                status: newStatus 
            };
            
            await updateDoc(campaignDocRef, updateData);

            toast({ title: 'محاكاة ناجحة', description: `تم إنفاق ${simulatedSpend.toFixed(2)}$ من الميزانية.`});
            forceCollectionUpdate();
        } catch (error: any) {
            const permissionError = new FirestorePermissionError({ path: `users/${campaign.userId}/campaigns/${campaign.id}`, operation: 'update' });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setSimulating(false);
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

                {campaign.status === 'نشط' && (
                    <div className="rounded-md border p-4 space-y-2">
                        <h4 className="font-semibold">محاكاة الإنفاق</h4>
                        <p className="text-sm text-muted-foreground">أدخل مبلغ الإنفاق اليومي لمحاكاة أداء الحملة.</p>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="daily-spend" className="sr-only">الإنفاق اليومي</Label>
                            <Input id="daily-spend" type="number" value={dailySpend} onChange={e => setDailySpend(e.target.value)} />
                            <Button onClick={handleSimulation} disabled={simulating}>
                                {simulating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                                <span className="mr-2">تحديث الإنفاق</span>
                            </Button>
                        </div>
                    </div>
                )}

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
