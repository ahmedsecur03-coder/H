'use client';

import React, { useState } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc, runTransaction, increment } from 'firebase/firestore';
import type { Campaign, User } from '@/lib/types';
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

export function CampaignActions({ campaign, onUpdate }: { campaign: Campaign; onUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleAction = async (action: 'activate' | 'pause' | 'delete') => {
        if (!firestore) return;
        setLoading(true);

        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
        const userDocRef = doc(firestore, 'users', campaign.userId);

        try {
            if (action === 'delete') {
                // For delete, we just remove the campaign document
                await updateDoc(campaignDocRef, {status: 'ملغي'}); // Or deleteDoc(campaignDocRef);
                toast({ title: 'نجاح', description: 'تم حذف الحملة.' });
            } else {
                 await runTransaction(firestore, async (transaction) => {
                    const userDoc = await transaction.get(userDocRef);
                    const campaignDoc = await transaction.get(campaignDocRef);
                    if (!userDoc.exists() || !campaignDoc.exists()) throw new Error("المستخدم أو الحملة غير موجود.");
                    
                    const userData = userDoc.data() as User;
                    const campaignData = campaignDoc.data() as Campaign;

                    if (action === 'activate') {
                        if(campaignData.status !== 'متوقف') throw new Error("يمكن فقط تفعيل الحملات المتوقفة.");
                        if(userData.adBalance < campaignData.budget) throw new Error("رصيد إعلانات المستخدم غير كافٍ.");
                        transaction.update(userDocRef, { adBalance: increment(-campaignData.budget) });
                        transaction.update(campaignDocRef, { status: 'نشط', startDate: new Date().toISOString() });
                    } else if (action === 'pause') {
                        if(campaignData.status !== 'نشط') throw new Error("يمكن فقط إيقاف الحملات النشطة.");
                        const remainingBudget = campaignData.budget - (campaignData.spend || 0);
                        if (remainingBudget > 0) {
                             transaction.update(userDocRef, { adBalance: increment(remainingBudget) });
                        }
                        transaction.update(campaignDocRef, { status: 'متوقف' });
                    }
                });
                toast({ title: 'نجاح', description: `تم ${action === 'activate' ? 'تفعيل' : 'إيقاف'} الحملة.` });
            }
            onUpdate();
        } catch (error: any) {
            console.error("Campaign Action Error:", error);
            const permissionError = new FirestorePermissionError({
                path: campaignDocRef.path,
                operation: 'update',
            });
            errorEmitter.emit('permission-error', permissionError);
            toast({ variant: 'destructive', title: 'فشل الإجراء', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />;
    }

    return (
        <div className="flex gap-1">
            {campaign.status === 'متوقف' && (
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
                            هذا الإجراء سيحذف الحملة بشكل نهائي. لا يمكن التراجع عن هذا الأمر.
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
