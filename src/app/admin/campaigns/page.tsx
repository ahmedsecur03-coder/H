
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, getDocs } from 'firebase/firestore';
import type { Campaign } from '@/lib/types';
import { handleAdminAction } from '@/app/admin/_actions/admin-actions';
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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ListChecks, Hourglass, BarChart2, TrendingUp, FileText } from 'lucide-react';
import Link from 'next/link';
import { CampaignDetailsDialog } from '@/app/dashboard/campaigns/_components/campaign-details-dialog';
import { CampaignActions } from './_components/campaign-actions';

// This function simulates campaign performance on the client-side for visual feedback.
function calculateCampaignPerformance(campaign: Campaign): Partial<Campaign> {
    const { startDate, durationDays, budget, status } = campaign;

    if (status !== 'نشط' || !startDate) {
        return {};
    }

    const now = Date.now();
    const startTime = new Date(startDate).getTime();
    const totalDurationMillis = durationDays * 24 * 60 * 60 * 1000;
    const progress = Math.min((now - startTime) / totalDurationMillis, 1);
    
    if (progress >= 1) {
        const finalSpend = budget;
        const finalImpressions = (campaign.impressions || 0) + Math.floor(Math.random() * (budget * 50) + (budget * 10));
        const finalClicks = (campaign.clicks || 0) + Math.floor(finalImpressions * (Math.random() * 0.05 + 0.01));
        const finalCtr = finalImpressions > 0 ? (finalClicks / finalImpressions) * 100 : 0;
        const finalCpc = finalClicks > 0 ? finalSpend / finalClicks : 0;
        const finalResults = Math.floor(finalClicks * (Math.random() * 0.3 + 0.1));

        return { 
            status: 'مكتمل', 
            spend: finalSpend,
            impressions: finalImpressions,
            clicks: finalClicks,
            ctr: finalCtr,
            cpc: finalCpc,
            results: finalResults,
        };
    }
    
    const simulatedSpend = Math.min(budget * progress * 1.1, budget);
    const spendIncrement = simulatedSpend - (campaign.spend || 0);

    if (spendIncrement > 0) {
        const impressions = (campaign.impressions || 0) + Math.floor(spendIncrement * (Math.random() * 150 + 50));
        const clicks = (campaign.clicks || 0) + Math.floor((impressions - (campaign.impressions || 0)) * (Math.random() * 0.05 + 0.01));
        return {
            spend: simulatedSpend,
            impressions,
            clicks,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            cpc: clicks > 0 ? simulatedSpend / clicks : 0,
            results: (campaign.results || 0) + Math.floor((clicks - (campaign.clicks || 0)) * 0.2),
        };
    }

    return {};
};


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

  const fetchCampaignsAndStats = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
      const campaignsQuery = collectionGroup(firestore, 'campaigns');
      
      const querySnapshot = await getDocs(campaignsQuery);
      let fetchedCampaigns: Campaign[] = [];
      
      querySnapshot.forEach(doc => {
        const pathSegments = doc.ref.path.split('/');
        const userId = pathSegments[1];
        const campaign = { id: doc.id, userId, ...doc.data() } as Campaign;
        
        // Apply final performance calculation if campaign is completed but has no stats
        if (campaign.status === 'مكتمل' && !campaign.impressions) {
            const finalPerformance = calculateCampaignPerformance({ ...campaign, status: 'نشط', startDate: campaign.startDate || new Date(Date.now() - (campaign.durationDays * 86400000)).toISOString() });
             fetchedCampaigns.push({ ...campaign, ...finalPerformance });
        } else {
            fetchedCampaigns.push(campaign);
        }
      });
      
      // Sort by date client-side
      fetchedCampaigns.sort((a,b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());

      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب الحملات.' });
    } finally {
      setIsLoading(false);
    }
  }, [firestore, toast]);
  
  // Stats are now derived from the 'campaigns' state
  const stats = useMemo(() => {
    const tempStatusCounts = ALL_STATUSES.reduce((acc, status) => ({...acc, [status]: 0}), {} as Record<Status, number>);
    let tempTotalBudget = 0;
    let tempTotalSpend = 0;

    campaigns.forEach(campaign => {
        tempTotalBudget += campaign.budget;
        tempTotalSpend += campaign.spend || 0;
        if (tempStatusCounts.hasOwnProperty(campaign.status)) {
            tempStatusCounts[campaign.status]++;
        }
    });

    return {
        active: tempStatusCounts['نشط'],
        totalBudget: tempTotalBudget,
        totalSpend: tempTotalSpend,
        statusCounts: ALL_STATUSES.map(s => ({ status: s, count: tempStatusCounts[s] }))
    };
  }, [campaigns]);


  useEffect(() => {
    fetchCampaignsAndStats();
  }, [fetchCampaignsAndStats]);

  const filteredCampaigns = useMemo(() => {
      if (filter === 'all') return campaigns;
      return campaigns.filter(c => c.status === filter);
  }, [campaigns, filter])


  const renderContent = () => {
    if (isLoading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
        </TableRow>
      ));
    }
    if (!filteredCampaigns || filteredCampaigns.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            لا توجد حملات تطابق هذا الفلتر.
          </TableCell>
        </TableRow>
      );
    }
    return filteredCampaigns.map((campaign) => (
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
            <CampaignActions campaign={campaign} onUpdate={fetchCampaignsAndStats} />
        </TableCell>
      </TableRow>
    ));
  }

  const chartConfig = {
    count: { label: "عدد الحملات" },
  };
  ALL_STATUSES.forEach((s, i) => {
    chartConfig[s] = { label: s, color: `hsl(var(--chart-${(i % 5) + 1}))` };
  });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">مراقبة الحملات</h1>
        <p className="text-muted-foreground">
          عرض جميع الحملات الإعلانية في النظام ومراجعتها.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الحملات النشطة حاليًا</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.active}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الميزانيات</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">${stats.totalBudget.toLocaleString('en-US', {maximumFractionDigits: 0})}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإنفاق</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">${stats.totalSpend.toLocaleString('en-US', {maximumFractionDigits: 0})}</div>}
          </CardContent>
        </Card>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
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
                                {status === 'بانتظار المراجعة' && stats.statusCounts.find(s => s.status === status)!.count > 0 && 
                                  <Badge variant="destructive" className="px-1.5">{stats.statusCounts.find(s => s.status === status)!.count}</Badge>
                                }
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
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>توزيع حالات الحملات</CardTitle>
                <CardDescription>نظرة سريعة على عدد الحملات في كل حالة.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-64 w-full" /> : 
                <ChartContainer config={chartConfig} className="h-64 w-full">
                    <BarChart data={stats.statusCounts} layout="vertical" margin={{left: 10, right:10}}>
                         <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                         <XAxis type="number" hide />
                         <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                         <Bar dataKey="count" layout="vertical" radius={5} fill="hsl(var(--primary))" />
                    </BarChart>
                </ChartContainer>}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
