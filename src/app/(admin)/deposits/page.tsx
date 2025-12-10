'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collectionGroup,
  query,
  where,
  doc,
  runTransaction,
} from 'firebase/firestore';
import type { Deposit, User } from '@/lib/types';

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
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDepositsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const pendingDepositsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collectionGroup(firestore, 'deposits'), where('status', '==', 'معلق'))
        : null,
    [firestore]
  );

  const { data: deposits, isLoading } = useCollection<Deposit>(pendingDepositsQuery);

  const handleDepositAction = async (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => {
    if (!firestore) return;
    setLoadingAction(deposit.id);
    try {
      const userDocRef = doc(firestore, 'users', deposit.userId);
      const depositDocRef = doc(firestore, `users/${deposit.userId}/deposits`, deposit.id);

      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
          throw new Error('المستخدم غير موجود.');
        }

        if (newStatus === 'مقبول') {
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
            لا توجد طلبات إيداع معلقة حالياً.
          </TableCell>
        </TableRow>
      );
    }
    
    return deposits.map((deposit) => (
      <TableRow key={deposit.id}>
        <TableCell>
          <div className="font-medium">{deposit.userId.substring(0, 10)}...</div>
          {/* We might need to fetch user email separately if needed */}
        </TableCell>
        <TableCell>${deposit.amount.toFixed(2)}</TableCell>
        <TableCell>{deposit.paymentMethod}</TableCell>
        <TableCell className="font-mono text-xs">
          {deposit.paymentMethod === 'فودافون كاش'
            ? deposit.details.phoneNumber
            : deposit.details.transactionId}
        </TableCell>
        <TableCell>
          {new Date(deposit.depositDate).toLocaleDateString('ar-EG')}
        </TableCell>
        <TableCell className="text-right">
          {loadingAction === deposit.id ? <Loader2 className="animate-spin" /> : (
            <>
              <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600" onClick={() => handleDepositAction(deposit, 'مقبول')}>
                <CheckCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDepositAction(deposit, 'مرفوض')}>
                <XCircle className="h-5 w-5" />
              </Button>
            </>
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

      <Card>
        <CardHeader>
          <CardTitle>طلبات الإيداع المعلقة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>معرف المستخدم</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>التفاصيل</TableHead>
                <TableHead>التاريخ</TableHead>
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
