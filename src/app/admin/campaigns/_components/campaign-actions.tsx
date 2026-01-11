
'use client';

import React, { useState } from 'react';
import type { Campaign } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, deleteDoc, runTransaction, increment, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

export function CampaignActions({ campaign, onUpdate }: { campaign: Campaign; onUpdate: () => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const [loading, setLoading] = useState(false);

    const handleAction = async (action: 'activate' | 'pause' | 'delete') => {
        if (!firestore) return;
        setLoading(true);

        const { userId, id: campaignId } = campaign;
        const campaignDocRef = doc(firestore, `users/${userId}/campaigns`, campaignId);

        try {
             if (action === 'delete') {
                // For delete, we first check if we need to refund any budget
                const userDocRef = doc(firestore, 'users', userId);
                await runTransaction(firestore, async (transaction) => {
                    const campaignDoc = await transaction.get(campaignDocRef);
                    if (!campaignDoc.exists()) return; // Already deleted
                    
                    const campaignData = campaignDoc.data() as Campaign;
                    
                    // Only refund if the campaign is not completed.
                    if (campaignData.status !== 'مكتمل') {
                        const remainingBudget = campaignData.budget - (campaignData.spend || 0);
                        if (remainingBudget > 0) {
                            transaction.update(userDocRef, { adBalance: increment(remainingBudget) });
                        }
                    }
                    transaction.delete(campaignDocRef);
                });
                toast({ title: 'نجاح', description: 'تم حذف الحملة بنجاح.' });

            } else if (action === 'activate') {
                await updateDoc(campaignDocRef, { status: 'نشط', startDate: new Date().toISOString() });
                toast({ title: 'نجاح', description: 'تم تفعيل الحملة بنجاح.' });
            } else if (action === 'pause') {
                await updateDoc(campaignDocRef, { status: 'متوقف' });
                toast({ title: 'نجاح', description: 'تم إيقاف الحملة بنجاح.' });
            }
            onUpdate();
        } catch (error: any) {
            const isPermissionError = error.code === 'permission-denied';
             if (isPermissionError) {
                const permissionError = new FirestorePermissionError({ path: campaignDocRef.path, operation: 'update' });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Campaign Action Error:", error);
                toast({ variant: 'destructive', title: 'فشل الإجراء', description: error.message });
            }
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />;
    }

    return (
        <div className="flex gap-1">
            {(campaign.status === 'متوقف' || campaign.status === 'بانتظار المراجعة') && (
                 <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600" onClick={() => handleAction('activate')}>
                    <Play className="h-4 w-4" />
                </Button>
            )}
             {campaign.status === 'نشط' && (
                 <Button variant="ghost" size="icon" className="text-yellow-500 hover:text-yellow-600" onClick={() => handleAction('pause')}>
                    <Pause className="h-4 w-4" />
                </Button>
            )}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف الحملة بشكل نهائي وإعادة أي ميزانية غير منفقة إلى رصيد إعلانات المستخدم. لا يمكن التراجع عن هذا الأمر.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAction('delete')}>متابعة الحذف</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
