
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import type { Campaign, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, PauseCircle } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
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
import { CampaignDetailsDialog } from './campaign-details-dialog';
import { useTranslation } from 'react-i18next';


export function UserCampaignActions({ campaign, forceCollectionUpdate }: { campaign: Campaign, forceCollectionUpdate: () => void }) {
    const { t } = useTranslation();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleStopCampaign = async () => {
        if (!firestore) return;
        setLoading(true);
        const userDocRef = doc(firestore, 'users', campaign.userId);
        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error(t('campaigns.actions.userNotFound'));

                const campaignDoc = await transaction.get(campaignDocRef);
                if (!campaignDoc.exists()) throw new Error(t('campaigns.actions.campaignNotFound'));
                
                const currentCampaignData = campaignDoc.data() as Campaign;
                if(currentCampaignData.status !== 'نشط') throw new Error(t('campaigns.actions.onlyActiveError'));

                // Calculate remaining budget
                const remainingBudget = currentCampaignData.budget - (currentCampaignData.spend || 0);

                // Refund remaining budget to user's adBalance
                if (remainingBudget > 0) {
                    const currentAdBalance = userDoc.data().adBalance ?? 0;
                    const newAdBalance = currentAdBalance + remainingBudget;
                    transaction.update(userDocRef, { adBalance: newAdBalance });
                }

                // Update campaign status to 'متوقف'
                transaction.update(campaignDocRef, { status: 'متوقف' });
            });

            toast({ title: t('success'), description: t('campaigns.actions.stopSuccess') });
            forceCollectionUpdate(); // Force re-fetch
            setIsAlertOpen(false);

        } catch (error: any) {
             toast({ variant: 'destructive', title: t('error'), description: error.message });
            const permissionError = new FirestorePermissionError({ path: userDocRef.path, operation: 'update' });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    };
    
    return (
       <div className="flex gap-2 justify-end">
            <CampaignDetailsDialog campaign={campaign} />
             {campaign.status === 'نشط' && (
                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="sm">
                            <PauseCircle className="ml-2 h-4 w-4" />
                            {t('stop')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('campaigns.actions.stopConfirmTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('campaigns.actions.stopConfirmDesc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={loading}>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleStopCampaign} disabled={loading} className="bg-destructive hover:bg-destructive/90">
                                {loading && <Loader2 className="ml-2 animate-spin" />}
                                {t('campaigns.actions.stopConfirmAction')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
       </div>
    );
}
