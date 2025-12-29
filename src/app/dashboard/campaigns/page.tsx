'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rocket, Clock, Briefcase, TrendingUp, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Campaign, User as UserType } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { UserCampaignActions, calculateCampaignPerformance } from './_components/user-campaign-actions';
import Link from 'next/link';

function CampaignsSkeleton() {
    return (
        <div className="space-y-6 pb-8">
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
    const { data: rawCampaigns, isLoading: campaignsLoading, forceCollectionUpdate } = useCollection<Campaign>(campaignsQuery);
    
    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData, isLoading: userLoading } = useDoc<UserType>(userDocRef);

    const isLoading = isUserLoading || campaignsLoading || userLoading;

    const campaigns = useMemo(() => {
        if (!rawCampaigns) return [];
        
        const updatedCampaigns = rawCampaigns.map(campaign => {
            if (campaign.status === 'نشط') {
                const liveData = calculateCampaignPerformance(campaign);
                if (liveData.status === 'مكتمل' && firestore && authUser) {
                    const campaignDocRef = doc(firestore, `users/${authUser.uid}/campaigns`, campaign.id);
                    updateDoc(campaignDocRef, liveData).catch(console.error);
                }
                return { ...campaign, ...liveData };
            }
            return campaign;
        });

        // Sort on the client-side by status priority
        return updatedCampaigns.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));

    }, [rawCampaigns, firestore, authUser]);


    const stats = useMemo(() => {
        if (!campaigns) return { active: 0, totalSpend: 0 };
        return campaigns.reduce((acc, c) => {
            if (c.status === 'نشط') acc.active++;
            acc.totalSpend += c.spend || 0;
            return acc;
        }, { active: 0, totalSpend: 0 });
    }, [campaigns]);

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">رصيد الإعلانات</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${(userData.adBalance || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">يُستخدم لتمويل الحملات الإعلانية.</p>
                </CardContent>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button className="w-full text-lg py-7" asChild>
                <Link href="/dashboard/campaigns/new">
                    <PlusCircle className="ml-2 h-5 w-5" />
                    إنشاء حملة جديدة
                </Link>
            </Button>
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
                    <>
                        {/* Mobile View */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
                            {campaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} onUpdate={forceCollectionUpdate} />)}
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
                                    {campaigns.map((campaign) => {
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
