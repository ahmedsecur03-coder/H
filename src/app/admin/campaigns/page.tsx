
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, getDocs, Query, getCountFromServer } from 'firebase/firestore';
import type { Campaign } from '@/lib/types';
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
import { CampaignActions } from './_components/campaign-actions';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ListChecks, Hourglass, BarChart2 } from 'lucide-react';

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
  const [stats, setStats] = useState({
      pending: 0,
      totalBudget: 0,
      totalSpend: 0,
      statusCounts: ALL_STATUSES.map(s => ({ status: s, count: 0 }))
  });

  const fetchCampaignsAndStats = async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
      const campaignsQuery = collectionGroup(firestore, 'campaigns');
      
      const querySnapshot = await getDocs(campaignsQuery);
      const fetchedCampaigns: Campaign[] = [];
      let tempTotalBudget = 0;
      let tempTotalSpend = 0;
      const tempStatusCounts = ALL_STATUSES.reduce((acc, status) => ({...acc, [status]: 0}), {} as Record<Status, number>);

      querySnapshot.forEach(doc => {
        const campaign = { id: doc.id, ...doc.data() } as Campaign;
        fetchedCampaigns.push(campaign);

        if (campaign.status === 'نشط' || campaign.status === 'مكتمل') {
            tempTotalBudget += campaign.budget;
        }
        tempTotalSpend += campaign.spend || 0;
        if (tempStatusCounts.hasOwnProperty(campaign.status)) {
            tempStatusCounts[campaign.status]++;
        }
      });
      
      setCampaigns(fetchedCampaigns);
      setStats({
          pending: tempStatusCounts['بانتظار المراجعة'],
          totalBudget: tempTotalBudget,
          totalSpend: tempTotalSpend,
          statusCounts: ALL_STATUSES.map(s => ({ status: s, count: tempStatusCounts[s] }))
      });

    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب الحملات.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndStats();
  }, [firestore]);

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
        <TableCell className="font-mono text-xs">{campaign.userId.substring(0, 10)}...</TableCell>
        <TableCell>{campaign.platform}</TableCell>
        <TableCell><Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></TableCell>
        <TableCell>${(campaign.spend || 0).toFixed(2)}</TableCell>
        <TableCell>${campaign.budget.toFixed(2)}</TableCell>
        <TableCell className="text-right">
          <CampaignActions campaign={campaign} forceCollectionUpdate={fetchCampaignsAndStats} />
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
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الحملات</h1>
        <p className="text-muted-foreground">
          مراقبة وإدارة الحملات النشطة للمستخدمين.
        </p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حملات قيد المراجعة</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stats.pending}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الميزانيات المعتمدة</CardTitle>
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
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-0">
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
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>توزيع حالات الحملات</CardTitle>
                <CardDescription>نظرة سريعة على عدد الحملات في كل حالة.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-64 w-full" /> : 
                <ChartContainer config={chartConfig} className="h-64 w-full">
                    <ResponsiveContainer>
                        <BarChart data={stats.statusCounts} layout="vertical" margin={{left: 10, right:10}}>
                             <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                             <XAxis type="number" hide />
                             <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                             <Bar dataKey="count" layout="vertical" radius={5} fill="hsl(var(--primary))" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
