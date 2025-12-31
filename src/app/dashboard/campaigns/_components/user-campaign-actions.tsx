'use server';

import { useState, useMemo } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, runTransaction, updateDoc, arrayUnion, Firestore } from 'firebase/firestore';
import type { Campaign, User, Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, PauseCircle, MoreHorizontal, FileText } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { CampaignDetailsDialog } from './campaign-details-dialog';


/**
 * A client-side action to automatically activate a campaign and deduct the balance.
 * This simulates a backend process after a short "review" period.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user who owns the campaign.
 * @param campaignId The ID of the campaign to activate.
 */
export async function activateCampaignAndDeductBalance(firestore: Firestore, userId: string, campaignId: string) {
    if (!firestore) {
        throw new Error("Firestore not initialized.");
    }
    
    const userDocRef = doc(firestore, `users/${userId}`);
    const campaignDocRef = doc(firestore, `users/${userId}/campaigns`, campaignId);

    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const campaignDoc = await transaction.get(campaignDocRef);

            if (!userDoc.exists() || !campaignDoc.exists()) {
                throw new Error("User or Campaign not found.");
            }
            
            const userData = userDoc.data() as User;
            const campaignData = campaignDoc.data() as Campaign;

            if (campaignData.status !== 'بانتظار المراجعة') {
                return;
            }

            if ((userData.adBalance ?? 0) < campaignData.budget) {
                const notification: Notification = {
                    id: `campaign-fail-${campaignId}`,
                    message: `فشلت مراجعة حملتك "${campaignData.name}" بسبب عدم كفاية رصيد الإعلانات.`,
                    type: 'error',
                    read: false,
                    createdAt: new Date().toISOString(),
                    href: '/dashboard/add-funds'
                };
                transaction.update(userDocRef, {
                    notifications: arrayUnion(notification)
                });
                return;
            }

            const newAdBalance = (userData.adBalance ?? 0) - campaignData.budget;
            
            const campaignUpdates = { 
                status: 'نشط' as const,
                startDate: new Date().toISOString(),
            };
            
            const notification: Notification = {
                id: `campaign-act-${campaignId}`,
                message: `تم تفعيل حملتك الإعلانية "${campaignData.name}" بنجاح وبدأت في العمل.`,
                type: 'success',
                read: false,
                createdAt: new Date().toISOString(),
                href: '/dashboard/campaigns'
            };

            transaction.update(userDocRef, { 
                adBalance: newAdBalance,
                notifications: arrayUnion(notification)
            });
            transaction.update(campaignDocRef, campaignUpdates);
        });
    } catch (error) {
        console.error(`Failed to activate campaign ${campaignId} for user ${userId}:`, error);
        throw error;
    }
}


// --- DYNAMIC SIMULATION ENGINE (SERVER ACTION) ---
export async function getLiveCampaignPerformance(campaign: Campaign): Promise<Partial<Campaign>> {
    if (campaign.status !== 'نشط' || !campaign.startDate) {
        return {};
    }

    const { startDate, durationDays, budget } = campaign;
    const now = Date.now();
    const startTime = new Date(startDate).getTime();
    const totalDurationMillis = durationDays * 24 * 60 * 60 * 1000;
    const endTime = startTime + totalDurationMillis;

    const elapsedMillis = Math.max(0, now - startTime);
    const progress = Math.min(elapsedMillis / totalDurationMillis, 1);
    
    if (progress >= 1) {
        const finalSpend = budget; 
        const finalImpressions = (campaign.impressions || 0) + Math.floor(Math.random() * (budget * 20));
        const finalClicks = (campaign.clicks || 0) + Math.floor(Math.random() * (budget * 2));
        const finalCtr = finalImpressions > 0 ? (finalClicks / finalImpressions) * 100 : 0;
        const finalCpc = finalClicks > 0 ? finalSpend / finalClicks : 0;

        return { 
            status: 'مكتمل', 
            spend: finalSpend,
            impressions: finalImpressions,
            clicks: finalClicks,
            ctr: finalCtr,
            cpc: finalCpc,
            results: Math.floor(finalClicks * 0.2),
        };
    }

    const simulatedSpend = Math.min(budget * progress * (1 + (Math.random() - 0.5) * 0.1), budget);

    if (simulatedSpend <= (campaign.spend || 0)) {
        return {};
    }

    const impressions = Math.floor(simulatedSpend * (Math.random() * 150 + 50));
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? simulatedSpend / clicks : 0;
    const results = Math.floor(clicks * 0.2);

    return {
        spend: simulatedSpend,
        impressions,
        clicks,
        ctr,
        cpc,
        results,
    };
};
// --- END SIMULATION ENGINE ---


export function UserCampaignActions({ campaign, forceCollectionUpdate }: { campaign: Campaign, forceCollectionUpdate: () => void }) {
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
            // Get the final performance state before stopping
            const finalPerformance = await getLiveCampaignPerformance(campaign);
            
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                const campaignDoc = await transaction.get(campaignDocRef);
                if (!campaignDoc.exists()) throw new Error("الحملة غير موجودة.");
                
                const currentCampaignData = campaignDoc.data() as Campaign;
                if(currentCampaignData.status !== 'نشط') throw new Error("لا يمكن إيقاف إلا الحملات النشطة.");

                const finalSpend = finalPerformance.spend ?? currentCampaignData.spend;

                const remainingBudget = currentCampaignData.budget - (finalSpend || 0);

                if (remainingBudget > 0) {
                    const currentAdBalance = userDoc.data()?.adBalance ?? 0;
                    const newAdBalance = currentAdBalance + remainingBudget;
                    transaction.update(userDocRef, { adBalance: newAdBalance });
                }

                transaction.update(campaignDocRef, { 
                    ...finalPerformance,
                    status: 'متوقف',
                    spend: finalSpend,
                });
            });

            toast({ title: "نجاح", description: "تم إيقاف الحملة وإعادة الرصيد المتبقي." });
            forceCollectionUpdate();
            setIsAlertOpen(false);

        } catch (error: any) {
             toast({ variant: 'destructive', title: "خطأ", description: error.message });
            const permissionError = new FirestorePermissionError({ path: userDocRef.path, operation: 'update' });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">فتح الإجراءات</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <CampaignDetailsDialog campaign={campaign}>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <FileText className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                        </DropdownMenuItem>
                    </CampaignDetailsDialog>
                    
                    {campaign.status === 'نشط' && (
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                <PauseCircle className="ml-2 h-4 w-4" />
                                إيقاف الحملة
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>هل أنت متأكد من إيقاف الحملة؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        سيتم إيقاف عرض الإعلانات وإعادة الميزانية المتبقية إلى رصيد إعلاناتك. لا يمكن التراجع عن هذا الإجراء.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStopCampaign} disabled={loading} className="bg-destructive hover:bg-destructive/90">
                        {loading && <Loader2 className="ml-2 animate-spin" />}
                        نعم، قم بالإيقاف
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
    