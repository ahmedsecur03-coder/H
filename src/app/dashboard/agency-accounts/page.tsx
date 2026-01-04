
'use client';

import React, { useState, useMemo } from 'react';
import type { AgencyAccount, User as UserType } from '@/lib/types';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wallet, DollarSign, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { Badge } from '@/components/ui/badge';
import { NewAccountDialog } from './_components/new-account-dialog';
import { ChargeBalanceDialog } from './_components/charge-balance-dialog';
import { ChargeAdBalanceDialog } from './_components/charge-ad-balance-dialog';

function AgencyAccountsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-2/3 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}


export default function AgencyAccountsPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (authUser ? doc(firestore, 'users', authUser.uid) : null), [authUser, firestore]);
  const { data: userData, isLoading: isUserDataLoading, forceDocUpdate } = useDoc<UserType>(userDocRef);

  const accountsQuery = useMemoFirebase(
    () => (firestore && authUser ? query(collection(firestore, `users/${authUser.uid}/agencyAccounts`), orderBy('createdAt', 'desc')) : null),
    [firestore, authUser]
  );
  const { data: accounts, isLoading: areAccountsLoading, forceCollectionUpdate } = useCollection<AgencyAccount>(accountsQuery);

  const isLoading = isUserLoading || isUserDataLoading || areAccountsLoading;

  if (isLoading || !userData || !authUser) {
    return <AgencyAccountsSkeleton />;
  }

  const handleActionComplete = () => {
    forceDocUpdate();
    forceCollectionUpdate();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حسابات الوكالة الإعلانية</h1>
        <p className="text-muted-foreground">
          تجاوز قيود الحسابات الجديدة بحسابات إعلانية موثوقة ذات حدود إنفاق عالية وبدون قلق من الإغلاق.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الرصيد الأساسي</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${userData.balance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">يستخدم لشراء الخدمات أو تحويله لرصيد إعلانات.</p>
                </CardContent>
                 <CardFooter>
                    <ChargeAdBalanceDialog userData={userData} onActionComplete={handleActionComplete}>
                       <Button size="sm" variant="secondary"><Zap className="ml-2 h-4 w-4" />تحويل إلى رصيد إعلانات</Button>
                    </ChargeAdBalanceDialog>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">رصيد الإعلانات العام</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${(userData.adBalance || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">يستخدم لتمويل الحملات أو شحن حسابات الوكالة.</p>
                </CardContent>
            </Card>
       </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">حساباتك المشتراة</h2>
        <NewAccountDialog onAccountCreated={forceCollectionUpdate}>
          <Button>
            <PlusCircle className="ml-2 h-4 w-4" />
            شراء حساب وكالة جديد
          </Button>
        </NewAccountDialog>
      </div>

      {accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = PLATFORM_ICONS[account.platform] || PLATFORM_ICONS.Default;
            return (
              <Card key={account.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Icon className="h-8 w-8 text-muted-foreground" />
                        <Badge variant={account.status === 'Active' ? 'default' : 'destructive'}>
                            {account.status === 'Active' ? 'نشط' : 'معلق'}
                        </Badge>
                    </div>
                  <CardTitle className="pt-2">{account.accountName}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-3xl font-bold font-mono">${account.balance.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">رصيد الحساب الحالي</p>
                </CardContent>
                <CardFooter>
                    <ChargeBalanceDialog account={account} userData={userData} onActionComplete={handleActionComplete}>
                       <Button className="w-full" variant="outline">
                           <Zap className="ml-2 h-4 w-4"/>
                           شحن الرصيد
                        </Button>
                    </ChargeBalanceDialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">ليس لديك أي حسابات وكالة بعد. قم بشراء حسابك الأول للبدء.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
