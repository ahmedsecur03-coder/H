
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collectionGroup,
  query,
  where,
  doc,
  runTransaction,
  orderBy
} from 'firebase/firestore';
import type { Deposit, User } from '@/lib/types';

import {
  Card,
  CardContent,
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
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const statusVariant = {
  'مقبول': 'default',
  'مرفوض': 'destructive',
  'معلق': 'secondary',
} as const;
type Status = keyof typeof statusVariant;

export default function AdminDepositsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Status>('معلق');

  const depositsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collectionGroup(firestore, 'deposits'), where('status', '==', activeTab), orderBy('depositDate', 'desc'))
        : null,
    [firestore, activeTab]
  );

  const { data: deposits, isLoading } = useCollection<Deposit>(depositsQuery);

  const handleDepositAction = async (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => {
    if (!firestore) return;
    setLoadingAction(deposit.id);
    try {
      const userDocRef = doc(firestore, 'users', deposit.userId);
      const depositDocRef = doc(firestore, `users/${deposit.userId}/deposits`, deposit.id);

      await runTransaction(firestore, async (transaction) => {
        if (newStatus === 'مقبول') {
           const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error('المستخدم غير موجود.');
            }
            const currentBalance = userDoc.data().balance ?? 0;
            const newBalance = currentBalance + deposit.amount;
            transaction.update(userDocRef, { balance: newBalance });
        }
        
        transaction.update(depositDocRef, { status: newStatus });
      });

      toast({
        title: 'نجاح',
        description: `تم ${newStatus === 'مقبول' ? 'قبول' : 'رفض'} طلب الإيداع بنجاح.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل تحديث حالة الطلب.',
      });
    } finally {
      setLoadingAction(null);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
         Array.from({length: 3}).map((_, i) => (
             <TableRow key={i}>
                {Array.from({length: 6}).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                ))}
             </TableRow>
         ))
      );
    }

    if (!deposits || deposits.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            لا توجد طلبات إيداع في هذا القسم.
          </TableCell>
        </TableRow>
      );
    }
    
    return deposits.map((deposit) => (
      <TableRow key={deposit.id}>
        <TableCell>
          <div className="font-medium font-mono text-xs">{deposit.userId}</div>
        </TableCell>
        <TableCell>${deposit.amount.toFixed(2)}</TableCell>
        <TableCell>{deposit.paymentMethod}</TableCell>
        <TableCell className="font-mono text-xs">
          {deposit.details?.phoneNumber || deposit.details?.transactionId || 'N/A'}
        </TableCell>
        <TableCell>
          {new Date(deposit.depositDate).toLocaleString('ar-EG')}
        </TableCell>
        <TableCell className="text-right">
          {loadingAction === deposit.id ? <Loader2 className="animate-spin mx-auto" /> : (
            activeTab === 'معلق' && (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDepositAction(deposit, 'مقبول')}>
                        <CheckCircle className="ml-2 h-4 w-4 text-green-500"/>
                        قبول
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDepositAction(deposit, 'مرفوض')}>
                        <XCircle className="ml-2 h-4 w-4 text-red-500"/>
                        رفض
                    </Button>
                </div>
            )
          )}
        </TableCell>
      </TableRow>
    ));
  }


  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الإيداعات</h1>
        <p className="text-muted-foreground">
          مراجعة طلبات الإيداع والموافقة عليها أو رفضها.
        </p>
      </div>

       <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Status)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="معلق">معلقة</TabsTrigger>
                <TabsTrigger value="مقبول">مقبولة</TabsTrigger>
                <TabsTrigger value="مرفوض">مرفوضة</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
                 <Card>
                    <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>معرف المستخدم</TableHead>
                            <TableHead>المبلغ</TableHead>
                            <TableHead>طريقة الدفع</TableHead>
                            <TableHead>التفاصيل</TableHead>
                            <TableHead>التاريخ</TableHead>
                            {activeTab === 'معلق' && <TableHead className="text-right">إجراءات</TableHead>}
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {renderContent()}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
