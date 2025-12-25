'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, runTransaction, addDoc } from 'firebase/firestore';
import type { AgencyAccount, User as UserType } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, Wallet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { BuyAccountDialog } from './_components/buy-account-dialog';
import { ChargeAccountDialog } from './_components/charge-account-dialog';
import { useToast } from '@/hooks/use-toast';

function AgencyAccountsSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-10 w-36" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export default function AgencyAccountsPage() {
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const accountsQuery = useMemoFirebase(
        () => (firestore && authUser ? query(collection(firestore, `users/${authUser.uid}/agencyAccounts`), orderBy('createdAt', 'desc')) : null),
        [firestore, authUser]
    );
    const { data: accounts, isLoading: accountsLoading, forceCollectionUpdate } = useCollection<AgencyAccount>(accountsQuery);

    const userDocRef = useMemoFirebase(
        () => (firestore && authUser ? doc(firestore, 'users', authUser.uid) : null),
        [firestore, authUser]
    );
    const { data: userData, isLoading: userLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

    const isLoading = isUserLoading || accountsLoading || userLoading;
    
    // Combine force updates
    const forceUpdateAll = () => {
        forceCollectionUpdate();
        forceDocUpdate();
    }

    if (isLoading || !userData || !authUser) {
        return <AgencyAccountsSkeleton />;
    }

    const statusVariant = {
        'Active': 'default',
        'Suspended': 'destructive',
    } as const;

    const totalAccountsBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">حساباتي الإعلانية (ايجنسي)</h1>
                <p className="text-muted-foreground">
                    شراء وشحن وإدارة حسابات الوكالة الإعلانية الخاصة بك لجميع المنصات.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">رصيد الإعلانات العام</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${userData.adBalance.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">يستخدم لشراء وشحن الحسابات.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي أرصدة الحسابات</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalAccountsBalance.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">مجموع الأرصدة في كل حساباتك.</p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>قائمة الحسابات</CardTitle>
                        <CardDescription>جميع حسابات الوكالة التي قمت بشرائها.</CardDescription>
                    </div>
                    <BuyAccountDialog userData={userData} onPurchaseComplete={forceUpdateAll}>
                        <Button>
                            <PlusCircle className="ml-2 h-4 w-4" />
                            شراء حساب جديد
                        </Button>
                    </BuyAccountDialog>
                </CardHeader>
                <CardContent>
                    {accounts && accounts.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المنصة</TableHead>
                                    <TableHead>اسم الحساب</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>الرصيد</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.map((account) => {
                                    const Icon = PLATFORM_ICONS[account.platform] || PLATFORM_ICONS.Default;
                                    return (
                                        <TableRow key={account.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-5 h-5 text-muted-foreground" />
                                                    <span>{account.platform}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{account.accountName}</TableCell>
                                            <TableCell><Badge variant={statusVariant[account.status]}>{account.status}</Badge></TableCell>
                                            <TableCell className="font-mono font-bold">${account.balance.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                 <ChargeAccountDialog account={account} userData={userData} onChargeComplete={forceUpdateAll}>
                                                    <Button variant="outline" size="sm">شحن الرصيد</Button>
                                                 </ChargeAccountDialog>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-10">
                            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">ابدأ بشراء حسابك الإعلاني الأول</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                ليس لديك أي حسابات إعلانية حتى الآن.
                            </p>
                             <BuyAccountDialog userData={userData} onPurchaseComplete={forceUpdateAll}>
                               <Button className="mt-4">
                                    <PlusCircle className="ml-2 h-4 w-4" />
                                    شراء حساب إعلاني
                                </Button>
                            </BuyAccountDialog>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}