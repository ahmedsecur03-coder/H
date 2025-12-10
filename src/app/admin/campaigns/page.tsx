

'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, doc, runTransaction, where } from 'firebase/firestore';
import type { Campaign, User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const statusVariant = {
  'نشط': 'default',
  'متوقف': 'secondary',
  'مكتمل': 'outline',
  'بانتظار المراجعة': 'destructive',
} as const;

type Status = keyof typeof statusVariant;

function CampaignActions({ campaign }: { campaign: Campaign }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleAction = async (newStatus: 'نشط' | 'متوقف') => {
        if (!firestore) return;
        setLoading(true);
        
        try {
            const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);
            await runTransaction(firestore, async (transaction) => {
                transaction.update(campaignDocRef, { status: newStatus });
            });
            toast({ title: 'نجاح', description: `تم تغيير حالة الحملة إلى ${newStatus}` });
            setOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const handleReject = async () => {
        if (!firestore) return;
        setLoading(true);

        try {
            const userDocRef = doc(firestore, 'users', campaign.userId);
            const campaignDocRef = doc(firestore, `users/${campaign.userId}/campaigns`, campaign.id);

            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("المستخدم غير موجود.");

                const currentAdBalance = userDoc.data().adBalance ?? 0;
                const newAdBalance = currentAdBalance + campaign.budget;
                
                transaction.update(userDocRef, { adBalance: newAdBalance });
                transaction.update(campaignDocRef, { status: 'متوقف', spend: campaign.budget }); // Mark as stopped and reflect budget returned
            });

            toast({ title: 'نجاح', description: 'تم رفض الحملة وإعادة الميزانية للمستخدم.' });
            setOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل الرفض', description: error.message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">تفاصيل</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>إجراءات الحملة: {campaign.name}</DialogTitle>
                    <DialogDescription>
                        مراجعة تفاصيل الحملة واتخاذ الإجراء المناسب.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <p><strong>المستخدم:</strong> <span className="font-mono text-xs">{campaign.userId}</span></p>
                    <p><strong>الميزانية:</strong> ${campaign.budget.toFixed(2)}</p>
                    <p><strong>المنصة:</strong> {campaign.platform}</p>
                    <p><strong>الحالة الحالية:</strong> <Badge variant={statusVariant[campaign.status] || 'secondary'}>{campaign.status}</Badge></p>
                </div>
                <DialogFooter className="gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                            {campaign.status === 'بانتظار المراجعة' && (
                                <>
                                    <Button variant="destructive" onClick={handleReject}>رفض وإعادة الميزانية</Button>
                                    <Button onClick={() => handleAction('نشط')}>موافقة وتفعيل</Button>
                                </>
                            )}
                             {campaign.status === 'نشط' && (
                                <Button variant="secondary" onClick={() => handleAction('متوقف')}>إيقاف مؤقت</Button>
                             )}
                              {campaign.status === 'متوقف' && (
                                <Button onClick={() => handleAction('نشط')}>إعادة تفعيل</Button>
                             )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminCampaignsPage() {
  const firestore = useFirestore();
  const [filter, setFilter] = useState<Status | 'all'>('all');

  const campaignsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let q = collectionGroup(firestore, 'campaigns');
    if (filter !== 'all') {
      return query(q, where('status', '==', filter));
    }
    return query(q);
  }, [firestore, filter]);

  const { data: campaigns, isLoading } = useCollection<Campaign>(campaignsQuery);

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
        <TableCell>${campaign.spend.toFixed(2)}</TableCell>
        <TableCell>${campaign.budget.toFixed(2)}</TableCell>
        <TableCell className="text-right">
          <CampaignActions campaign={campaign} />
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الحملات</h1>
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
