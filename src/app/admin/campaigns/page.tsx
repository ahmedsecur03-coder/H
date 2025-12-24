
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, getDocs, Query } from 'firebase/firestore';
import type { Campaign } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
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
import { useToast } from '@/hooks/use-toast';

const statusVariant = {
  'نشط': 'default',
  'متوقف': 'secondary',
  'مكتمل': 'outline',
  'بانتظار المراجعة': 'destructive',
} as const;

type Status = keyof typeof statusVariant;

export default function AdminCampaignsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
      let campaignsQuery: Query = collectionGroup(firestore, 'campaigns');
      if (filter !== 'all') {
        campaignsQuery = query(campaignsQuery, where('status', '==', filter));
      }
      
      const querySnapshot = await getDocs(campaignsQuery);
      const fetchedCampaigns: Campaign[] = [];
      querySnapshot.forEach(doc => {
        fetchedCampaigns.push({ id: doc.id, ...doc.data() } as Campaign);
      });
      setCampaigns(fetchedCampaigns);

    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب الحملات.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [firestore, filter]);

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
          <CampaignActions campaign={campaign} forceCollectionUpdate={fetchCampaigns} />
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الحملات</h1>
        <p className="text-muted-foreground">
          مراقبة وإدارة الحملات النشطة للمستخدمين.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>فلترة الحملات</CardTitle>
          <div className="flex flex-wrap gap-2 pt-4">
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
