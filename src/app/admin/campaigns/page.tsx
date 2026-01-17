
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, where, orderBy, limit, collectionGroup } from 'firebase/firestore';
import type { Campaign, User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ListChecks, Hourglass, BarChart2, TrendingUp, FileText, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { CampaignDetailsDialog } from '@/app/dashboard/campaigns/_components/campaign-details-dialog';
import { CampaignActions } from './_components/campaign-actions';

const statusVariant = {
  'نشط': 'default',
  'متوقف': 'secondary',
  'مكتمل': 'outline',
  'بانتظار المراجعة': 'destructive',
} as const;

type Status = keyof typeof statusVariant;
const ALL_STATUSES = Object.keys(statusVariant) as Status[];


export default function AdminCampaignsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<Status | 'all'>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
      // This is now much more efficient, fetching all campaigns in a single query.
      let q = query(collectionGroup(firestore, 'campaigns'));
      
      if (filter !== 'all') {
        q = query(q, where('status', '==', filter));
      }
      
      const campaignsSnapshot = await getDocs(q);
      const allCampaigns = campaignsSnapshot.docs.map(doc => {
          const pathSegments = doc.ref.path.split('/');
          const userId = pathSegments[pathSegments.indexOf('users') + 1];
          return { id: doc.id, userId, ...doc.data() } as Campaign
      });
      
      // Sort all campaigns by date after fetching them
      allCampaigns.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateB - dateA;
      });

      setCampaigns(allCampaigns);

    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب الحملات. قد تحتاج لإنشاء فهرس في Firestore.' });
    } finally {
      setIsLoading(false);
    }
  }, [firestore, toast, filter]);


  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

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
        <TableCell>
            <Link href={`/admin/users?search=${campaign.userId}`} className="font-mono text-xs text-primary hover:underline">{campaign.userId.substring(0, 10)}...</Link>
        </TableCell>
        <TableCell>{campaign.platform}</TableCell>
        <TableCell><Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></TableCell>
        <TableCell>${(campaign.spend || 0).toFixed(2)}</TableCell>
        <TableCell>${campaign.budget.toFixed(2)}</TableCell>
        <TableCell className="flex justify-end items-center gap-2">
            <CampaignDetailsDialog campaign={campaign}>
                 <Button variant="outline" size="sm"><FileText className="ml-2 h-4 w-4" />تفاصيل</Button>
            </CampaignDetailsDialog>
            <CampaignActions campaign={campaign} onUpdate={fetchCampaigns} />
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><Megaphone className="h-8 w-8" />مراقبة الحملات</h1>
        <p className="text-muted-foreground">
          عرض جميع الحملات الإعلانية في النظام ومراجعتها.
        </p>
      </div>

        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>قائمة الحملات</CardTitle>
                <div className="w-48">
                    <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
                        <SelectTrigger>
                            <SelectValue placeholder="فلترة حسب الحالة" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الحالات</SelectItem>
                            {ALL_STATUSES.map(status => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <span>{status}</span>
                              </div>
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-0">
            <div className="overflow-x-auto">
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
            </div>
            </CardContent>
        </Card>
    </div>
  );
}
