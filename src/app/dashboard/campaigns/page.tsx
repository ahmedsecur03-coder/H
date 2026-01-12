
'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, runTransaction, increment } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rocket, Briefcase, TrendingUp, DollarSign, PauseCircle, MoreHorizontal, FileText, Wallet, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Campaign, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import Link from 'next/link';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { CampaignDetailsDialog } from './_components/campaign-details-dialog';
import { ChargeAdBalanceDialog } from '../agency-accounts/_components/charge-ad-balance-dialog';


// This function simulates the performance of a single active campaign
const calculateCampaignPerformance = (campaign: Campaign): Partial<Campaign> => {
    if (campaign.status !== 'نشط' || !campaign.startDate) return {};

    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const elapsedHours = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    if (elapsedHours <= 0) return {};

    // Simulate spend rate based on budget and duration
    const totalDurationHours = campaign.durationDays * 24;
    const spendRatePerHour = campaign.budget / totalDurationHours;
    let newSpend = elapsedHours * spendRatePerHour;

    if (newSpend <= (campaign.spend || 0)) return {}; // No update if new spend is not greater

    // Simulate performance metrics based on the new total spend
    const baseCpc = (campaign.platform === 'Google' ? 0.5 : 0.2) + (Math.random() * 0.3); // Add some randomness
    const newTotalClicks = Math.floor(newSpend / baseCpc);
    const newTotalImpressions = (newTotalClicks > 0 ? newTotalClicks / (0.01 + Math.random() * 0.02) : 0);

    const updatedCampaign: Partial<Campaign> = {
        spend: Math.min(newSpend, campaign.budget),
        impressions: Math.round(newTotalImpressions),
        clicks: Math.round(newTotalClicks),
    };

    // Recalculate CTR and CPC based on total values
    if (updatedCampaign.impressions && updatedCampaign.impressions > 0) {
        updatedCampaign.ctr = ((updatedCampaign.clicks || 0) / updatedCampaign.impressions) * 100;
    }
    if (updatedCampaign.clicks && updatedCampaign.clicks > 0) {
        updatedCampaign.cpc = (updatedCampaign.spend || 0) / updatedCampaign.clicks;
    }
    
    // Simulate results based on goal
    if (updatedCampaign.clicks) {
        updatedCampaign.results = Math.round(updatedCampaign.clicks * (0.1 + Math.random() * 0.15));
    }

    // Check for completion
    if (updatedCampaign.spend! >= campaign.budget) {
        updatedCampaign.status = 'مكتمل';
        updatedCampaign.spend = campaign.budget; // Cap spend at budget
    }

    return updatedCampaign;
};


function UserCampaignActions({ campaign, forceCollectionUpdate }: { campaign: Campaign, forceCollectionUpdate: () => void }) {
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
                const campaignDoc = await transaction.get(campaignDocRef);
                if (!campaignDoc.exists()) throw new Error("الحملة غير موجودة.");
                
                const currentCampaignData = campaignDoc.data() as Campaign;
                if (currentCampaignData.status !== 'نشط') throw new Error("لا يمكن إيقاف إلا الحملات النشطة.");

                const remainingBudget = currentCampaignData.budget - (currentCampaignData.spend || 0);

                if (remainingBudget > 0) {
                    transaction.update(userDocRef, { adBalance: increment(remainingBudget) });
                }

                transaction.update(campaignDocRef, { 
                    status: 'متوقف',
                });
            });

            toast({ title: "نجاح", description: "تم إيقاف الحملة وإعادة الرصيد المتبقي." });
            forceCollectionUpdate();
            setIsAlertOpen(false);

        } catch (error: any) {
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


function CampaignsSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

const statusOrder: Record<Campaign['status'], number> = {
    'نشط': 1,
    'بانتظار المراجعة': 2,
    'متوقف': 3,
    'مكتمل': 4,
};

function CampaignCard({ campaign, onUpdate }: { campaign: Campaign, onUpdate: () => void }) {
    const Icon = PLATFORM_ICONS[campaign.platform] || PLATFORM_ICONS.Default;
    const statusVariant = {
        'نشط': 'default',
        'متوقف': 'secondary',
        'مكتمل': 'outline',
        'بانتظار المراجعة': 'destructive',
    } as const;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex-row items-start gap-4">
                <Icon className="w-8 h-8 text-muted-foreground" />
                <div>
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <CardDescription>{new Date(campaign.startDate || campaign.endDate || Date.now()).toLocaleDateString('ar-EG')}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm flex-grow">
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">الحالة</span>
                    <Badge variant={statusVariant[campaign.status]}>{campaign.status}</Badge>
                </div>
                 <div className="flex justify-between">
                    <span className="text-muted-foreground">الإنفاق / الميزانية</span>
                    <span className="font-mono font-bold">${(campaign.spend || 0).toFixed(2)} / ${campaign.budget.toFixed(2)}</span>
                </div>
            </CardContent>
            <CardFooter>
                 <UserCampaignActions campaign={campaign} forceCollectionUpdate={onUpdate} />
            </CardFooter>
        </Card>
    )
}

export default function CampaignsPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    const campaignsQuery = useMemoFirebase(
        () => (firestore && authUser ? query(collection(firestore, `users/${authUser.uid}/campaigns`), orderBy('startDate', 'desc')) : null),
        [firestore, authUser]
    );
    const { data: campaigns, isLoading: campaignsLoading, forceCollectionUpdate } = useCollection<Campaign>(campaignsQuery);

    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData, isLoading: userLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);
    

    // Client-side campaign simulation effect
    useEffect(() => {
        if (!campaigns || !firestore || !authUser) return;

        const updateAllCampaigns = () => {
             campaigns.forEach(campaign => {
                if (campaign.status === 'بانتظار المراجعة') {
                    // Auto-activate pending campaigns after a short delay
                    const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
                    updateDoc(campaignDocRef, { status: 'نشط', startDate: new Date().toISOString() });
                } else if (campaign.status === 'نشط') {
                    const updates = calculateCampaignPerformance(campaign);
                    if (Object.keys(updates).length > 0) {
                        const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
                        updateDoc(campaignDocRef, updates);
                    }
                }
            });
             // We call forceCollectionUpdate to get the latest data from the client cache after updates.
             forceCollectionUpdate();
        }
        
        // Run once on mount to catch up on progress
        updateAllCampaigns();

        const interval = setInterval(updateAllCampaigns, 300000); // Run every 5 minutes

        return () => clearInterval(interval);
    }, [campaigns, firestore, authUser, forceCollectionUpdate]);


    const sortedCampaigns = useMemo(() => {
        if (!campaigns) return [];
        return [...campaigns].sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
    }, [campaigns]);


    const stats = useMemo(() => {
        if (!campaigns) return { active: 0, totalSpend: 0 };
        return campaigns.reduce((acc, c) => {
            if (c.status === 'نشط') acc.active++;
            acc.totalSpend += c.spend || 0;
            return acc;
        }, { active: 0, totalSpend: 0 });
    }, [campaigns]);

    const isLoading = isUserLoading || campaignsLoading || userLoading;
    
    const handleActionComplete = () => {
        forceDocUpdate();
        forceCollectionUpdate();
    }

    if (isLoading || !userData || !authUser) {
        return <CampaignsSkeleton />;
    }
    
    const statusVariant = {
        'نشط': 'default',
        'متوقف': 'secondary',
        'مكتمل': 'outline',
        'بانتظار المراجعة': 'destructive',
    } as const;


  return (
     <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">الحملات الإعلانية</h1>
            <p className="text-muted-foreground">
             أنشئ وراقب حملاتك الإعلانية على مختلف المنصات من مكان واحد.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">رصيد الإعلانات</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${(userData.adBalance || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">يستخدم لتمويل الحملات الإعلانية.</p>
                </CardContent>
                <CardFooter>
                     <ChargeAdBalanceDialog userData={userData} onActionComplete={handleActionComplete}>
                       <Button size="sm" variant="secondary"><Zap className="ml-2 h-4 w-4" />تحويل رصيد</Button>
                    </ChargeAdBalanceDialog>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الحملات النشطة</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.active}</div>
                    <p className="text-xs text-muted-foreground">إجمالي الحملات التي تعمل حاليًا.</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">إجمالي الإنفاق</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalSpend.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">مجموع ما تم إنفاقه على كل الحملات.</p>
                </CardContent>
            </Card>
        </div>

        <Button className="w-full text-lg py-7" asChild>
            <Link href="/dashboard/campaigns/new">
                <PlusCircle className="ml-2 h-5 w-5" />
                إنشاء حملة جديدة
            </Link>
        </Button>
        
        <Card>
            <CardHeader>
                <CardTitle>سجل الحملات</CardTitle>
                <CardDescription>عرض لجميع حملاتك الإعلانية وحالاتها.</CardDescription>
            </CardHeader>
            <CardContent>
                {sortedCampaigns && sortedCampaigns.length > 0 ? (
                    <>
                        {/* Mobile View */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
                            {sortedCampaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} onUpdate={forceCollectionUpdate} />)}
                        </div>

                        {/* Desktop View */}
                        <div className="overflow-x-auto hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>اسم الحملة</TableHead>
                                        <TableHead>الحالة</TableHead>
                                        <TableHead>الإنفاق / الميزانية</TableHead>
                                        <TableHead className="text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCampaigns.map((campaign) => {
                                        const Icon = PLATFORM_ICONS[campaign.platform] || PLATFORM_ICONS.Default;
                                        return (
                                        <TableRow key={campaign.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-5 h-5 text-muted-foreground" />
                                                    <span>{campaign.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></TableCell>
                                            <TableCell className="font-mono">
                                                ${(campaign.spend || 0).toFixed(2)} / ${campaign.budget.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <UserCampaignActions campaign={campaign} forceCollectionUpdate={forceCollectionUpdate} />
                                            </TableCell>
                                        </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10">
                        <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">ابدأ رحلتك الإعلانية</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            ليس لديك أي حملات حتى الآن. انقر أدناه لإنشاء حملتك الأولى.
                        </p>
                        <Button className="mt-4" asChild>
                            <Link href="/dashboard/campaigns/new">
                                <PlusCircle className="ml-2 h-4 w-4" />
                                إنشاء حملة جديدة
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
