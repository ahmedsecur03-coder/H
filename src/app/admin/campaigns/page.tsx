
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, Query } from 'firebase/firestore';
import type { Campaign } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignActions } from './_components/campaign-actions';

const statusVariant = {
  'نشط': 'default',
  'متوقف': 'secondary',
  'مكتمل': 'outline',
  'بانتظار المراجعة': 'destructive',
} as const;

type Status = keyof typeof statusVariant;

export default function AdminCampaignsPage() {
  const firestore = useFirestore();
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const campaignsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const campaignsCollection = collectionGroup(firestore, 'campaigns');
    if (filter !== 'all') {
      return query(campaignsCollection, where('status', '==', filter));
    }
    return query(campaignsCollection);
  }, [firestore, filter]);

  const { data: campaigns, isLoading, forceCollectionUpdate } = useCollection<Campaign>(campaignsQuery);

  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
        </TableRow>
      ));
    }
    if (!campaigns || campaigns.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            لا توجد حملات تطابق هذا الفلتر.
          </TableCell>
        </TableRow>
      );
    }
    return campaigns.map((campaign) => (
      <TableRow key={campaign.id}>
        <TableCell className="font-medium">{campaign.name}</TableCell>
        <TableCell className="font-mono text-xs">{campaign.userId.substring(0, 10)}...</TableCell>
        <TableCell>{campaign.platform}</TableCell>
        <TableCell><Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></TableCell>
        <TableCell>${(campaign.spend || 0).toFixed(2)}</TableCell>
        <TableCell>${campaign.budget.toFixed(2)}</TableCell>
        <TableCell className="text-right">
          <CampaignActions campaign={campaign} forceCollectionUpdate={forceCollectionUpdate} />
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الحملات</h1>
        <p className="text-muted-foreground">
          مراجعة الحملات الإعلانية للمستخدمين والموافقة عليها أو رفضها.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>الكل</Button>
            {(Object.keys(statusVariant) as Status[]).map(status => (
              <Button key={status} variant={filter === status ? 'default' : 'outline'} onClick={() => setFilter(status)}>{status}</Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الحملة</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>المنصة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإنفاق</TableHead>
                <TableHead>الميزانية</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
