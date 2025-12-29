
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import type { Campaign, User } from '@/lib/types';
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

// --- DYNAMIC SIMULATION ENGINE ---
export const calculateCampaignPerformance = (campaign: Campaign): Partial<Campaign> => {
    if (campaign.status !== 'نشط' || !campaign.startDate) {
        return {};
    }

    const { startDate, durationDays, budget, spend: currentSpend } = campaign;
    const now = Date.now();
    const startTime = new Date(startDate).getTime();
    const totalDurationMillis = durationDays * 24 * 60 * 60 * 1000;
    const endTime = startTime + totalDurationMillis;

    // If campaign has finished
    if (now >= endTime) {
        return { 
            status: 'مكتمل', 
            spend: budget, // Ensure it's marked as complete with full spend
            impressions: (campaign.impressions || 0) + Math.floor(Math.random() * 1000), // add some final random impressions
            clicks: (campaign.clicks || 0) + Math.floor(Math.random() * 50)
        };
    }

    const elapsedMillis = now - startTime;
    const progress = Math.min(elapsedMillis / totalDurationMillis, 1);
    
    // Calculate the "ideal" spend based on time progress, with some organic randomness
    const idealSpend = budget * progress;
    const simulatedSpend = Math.min(idealSpend * (1 + (Math.random() - 0.5) * 0.1), budget);

    if (simulatedSpend <= currentSpend) {
        return {}; // No significant change
    }

    const impressions = Math.floor(simulatedSpend * (Math.random() * 150 + 50)); // Random impressions per dollar
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // CTR between 1% and 6%
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? simulatedSpend / clicks : 0;
    const results = Math.floor(clicks * 0.2); // Assume 20% of clicks are "results"

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

    // Get the most up-to-date campaign performance data for display
    const liveCampaignData = useMemo(() => {
        if (campaign.status === 'نشط') {
            return { ...campaign, ...calculateCampaignPerformance(campaign) };
        }
        return campaign;
    }, [campaign]);


    const handleStopCampaign = async () => {
        if (!firestore) return;
        setLoading(true);
        const userDocRef = doc(firestore, 'users', campaign.userId);
        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);

        try {
            // First, calculate the most up-to-date performance before stopping
            const finalPerformance = calculateCampaignPerformance(campaign);
            
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                const campaignDoc = await transaction.get(campaignDocRef);
                if (!campaignDoc.exists()) throw new Error("الحملة غير موجودة.");
                
                const currentCampaignData = campaignDoc.data() as Campaign;
                if(currentCampaignData.status !== 'نشط') throw new Error("لا يمكن إيقاف إلا الحملات النشطة.");

                // Use the most recently calculated spend
                const finalSpend = finalPerformance.spend ?? currentCampaignData.spend;

                // Calculate remaining budget
                const remainingBudget = currentCampaignData.budget - (finalSpend);

                // Refund remaining budget to user's adBalance
                if (remainingBudget > 0) {
                    const currentAdBalance = userDoc.data().adBalance ?? 0;
                    const newAdBalance = currentAdBalance + remainingBudget;
                    transaction.update(userDocRef, { adBalance: newAdBalance });
                }

                // Update campaign status to 'متوقف' and set final numbers
                transaction.update(campaignDocRef, { 
                    ...finalPerformance,
                    status: 'متوقف',
                    spend: finalSpend,
                });
            });

            toast({ title: "نجاح", description: "تم إيقاف الحملة وإعادة الرصيد المتبقي." });
            forceCollectionUpdate(); // Force re-fetch
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
                    <CampaignDetailsDialog campaign={liveCampaignData}>
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
