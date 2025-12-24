'use client';

import { useMemo, useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rocket, Clock, Briefcase } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Campaign, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { NewCampaignDialog } from './_components/new-campaign-dialog';
import { UserCampaignActions } from './_components/user-campaign-actions';
import Link from 'next/link';

function CampaignsSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

export default function CampaignsPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();

    const campaignsQuery = useMemoFirebase(
        () => (firestore && authUser ? query(collection(firestore, `users/${authUser.uid}/campaigns`), orderBy('startDate', 'desc')) : null),
        [firestore, authUser]
    );
    // Use a different name for the hook's return value to avoid conflict
    const { data: initialCampaigns, isLoading: campaignsLoading, forceCollectionUpdate } = useCollection<Campaign>(campaignsQuery);
    
    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData, isLoading: userLoading } = useDoc<UserType>(userDocRef);

    // This state will hold the dynamically updated campaign data
    const [campaigns, setCampaigns] = useState<Campaign[] | null>(initialCampaigns);

    useEffect(() => {
        // Initialize the local state with data from Firestore
        if (initialCampaigns) {
            setCampaigns(initialCampaigns);
        }
    }, [initialCampaigns]);

    // Effect for simulating campaign performance updates
    useEffect(() => {
        const updateCampaigns = () => {
            setCampaigns(prevCampaigns => {
                if (!prevCampaigns) return null;

                const updatedCampaigns = prevCampaigns.map(campaign => {
                    // Only update 'active' campaigns
                    if (campaign.status !== 'نشط') {
                        return campaign;
                    }
                    
                    // --- Simulation Logic ---
                    const newImpressions = (campaign.impressions || 0) + Math.floor(Math.random() * 500) + 100;
                    const newClicks = (campaign.clicks || 0) + Math.floor(newImpressions / (Math.floor(Math.random() * 200) + 80));
                    // Ensure spend doesn't exceed budget
                    const newSpend = Math.min(campaign.budget, (campaign.spend || 0) + (newClicks - (campaign.clicks || 0)) * (Math.random() * 0.1 + 0.05));
                    const newResults = (campaign.results || 0) + Math.floor(newClicks / (Math.floor(Math.random() * 5) + 2));
                    const ctr = newImpressions > 0 ? (newClicks / newImpressions) * 100 : 0;
                    const cpc = newClicks > 0 ? newSpend / newClicks : 0;
                    let status = campaign.status;

                    if (newSpend >= campaign.budget) {
                        status = 'مكتمل';
                    }
                    // --- End Simulation Logic ---

                    const updatedCampaign = {
                        ...campaign,
                        impressions: newImpressions,
                        clicks: newClicks,
                        spend: newSpend,
                        results: newResults,
                        ctr: ctr,
                        cpc: cpc,
                        status: status,
                    };

                    // Persist updates to Firestore in the background (non-blocking)
                    if(firestore && authUser && (updatedCampaign.status !== campaign.status || (updatedCampaign.impressions % 10 === 0))) { // Update every 10 ticks approx
                        const campaignRef = doc(firestore, `users/${authUser.uid}/campaigns/${campaign.id}`);
                        // Update Firestore document without awaiting to avoid blocking UI thread
                        updateDoc(campaignRef, {
                            impressions: updatedCampaign.impressions,
                            clicks: updatedCampaign.clicks,
                            spend: updatedCampaign.spend,
                            results: updatedCampaign.results,
                            ctr: updatedCampaign.ctr,
                            cpc: updatedCampaign.cpc,
                            status: updatedCampaign.status
                        }).catch(err => console.error("Failed to update campaign in background", err));
                    }
                    
                    return updatedCampaign;
                });
                
                return updatedCampaigns;
            });
        };

        // Run once immediately on load to get initial simulated data
        updateCampaigns(); 
        
        // Then run every 30 seconds to simulate real-time updates
        const interval = setInterval(updateCampaigns, 30000); 

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [firestore, authUser]); // Rerun if auth state changes


    const isLoading = isUserLoading || campaignsLoading || userLoading;

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
     <div className="space-y-6 pb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الحملات الإعلانية</h1>
            <p className="text-muted-foreground">
             أنشئ وراقب حملاتك الإعلانية على مختلف المنصات من مكان واحد.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <NewCampaignDialog userData={userData} onCampaignCreated={forceCollectionUpdate}>
                <Button className="w-full text-lg py-7">
                    <PlusCircle className="ml-2 h-5 w-5" />
                    إنشاء حملة جديدة
                </Button>
            </NewCampaignDialog>
             <Button variant="outline" className="w-full text-lg py-7" asChild>
                <Link href="/dashboard/agency-accounts">
                    <Briefcase className="ml-2 h-5 w-5" />
                    إدارة حسابات الوكالة
                </Link>
            </Button>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>سجل الحملات</CardTitle>
                <CardDescription>عرض لجميع حملاتك الإعلانية وحالاتها.</CardDescription>
            </CardHeader>
            <CardContent>
                {campaigns && campaigns.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم الحملة</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>المدة</TableHead>
                                <TableHead className="text-right">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign) => {
                                const Icon = PLATFORM_ICONS[campaign.platform] || PLATFORM_ICONS.Default;
                                return (
                                <TableRow key={campaign.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                            <span>{campaign.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell><Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></TableCell>
                                    <TableCell>
                                        <div className='flex items-center gap-1 text-muted-foreground'>
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{campaign.durationDays} أيام</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <UserCampaignActions campaign={campaign} forceCollectionUpdate={forceCollectionUpdate} />
                                    </TableCell>
                                </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-10">
                        <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">ابدأ رحلتك الإعلانية</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            ليس لديك أي حملات حتى الآن. انقر أدناه لإنشاء حملتك الأولى.
                        </p>
                         <NewCampaignDialog userData={userData} onCampaignCreated={forceCollectionUpdate}>
                           <Button className="mt-4">
                                <PlusCircle className="ml-2 h-4 w-4" />
                                إنشاء حملة جديدة
                            </Button>
                        </NewCampaignDialog>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
