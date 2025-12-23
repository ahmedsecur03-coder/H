
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collectionGroup,
  query,
  where,
  doc,
  runTransaction,
  orderBy,
  Query,
  collection
} from 'firebase/firestore';
import type { Withdrawal, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2, HandCoins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type Status = 'معلق' | 'مقبول' | 'مرفوض';

function WithdrawalTable({ status }: { status: Status }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const withdrawalsQuery = useMemoFirebase(
    () => {
        if (!firestore) return null;
        const withdrawalsCollection = collectionGroup(firestore, 'withdrawals');
        return query(
            withdrawalsCollection, 
            where('status', '==', status), 
            orderBy('requestDate', 'desc')
        );
    },
    [firestore, status]
  );
  
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users')) : null, [firestore]);
  const { data: usersData } = useCollection<User>(usersQuery);
  const usersMap = useMemo(() => usersData ? new Map(usersData.map(u => [u.id, u])) : new Map(), [usersData]);

  const { data: withdrawals, isLoading } = useCollection<Withdrawal>(withdrawalsQuery);

  const handleWithdrawalAction = async (withdrawal: Withdrawal, newStatus: 'مقبول' | 'مرفوض') => {
    if (!firestore) return;
    setLoadingAction(withdrawal.id);
    const userDocRef = doc(firestore, 'users', withdrawal.userId);
    const withdrawalDocRef = doc(firestore, `users/${withdrawal.userId}/withdrawals`, withdrawal.id);

    try {
      await runTransaction(firestore, async (transaction) => {
        if (newStatus === 'مقبول') {
           const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error('المستخدم غير موجود.');
            }
            const userData = userDoc.data() as User;
            const currentEarnings = userData.affiliateEarnings ?? 0;
            if (currentEarnings < withdrawal.amount) {
                throw new Error('رصيد أرباح المستخدم غير كافٍ.');
            }
            const newEarnings = currentEarnings - withdrawal.amount;
            transaction.update(userDocRef, { affiliateEarnings: newEarnings });
        }
        
        transaction.update(withdrawalDocRef, { status: newStatus });
      });

      toast({
        title: 'نجاح',
        description: `تم ${newStatus === 'مقبول' ? 'قبول' : 'رفض'} طلب السحب بنجاح.`,
      });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ في المعاملة', description: error.message });
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
      setLoadingAction(null);
    }
  };
  
  if (isLoading) {
    return (
       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>طريقة السحب</TableHead>
              <TableHead>التفاصيل</TableHead>
              <TableHead>التاريخ</TableHead>
              {status === 'معلق' && <TableHead className="text-right">إجراءات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({length: 5}).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({length: status === 'معلق' ? 6 : 5}).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
            ))}
          </TableBody>
       </Table>
    );
  }

  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
        لا توجد طلبات سحب في هذا القسم.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المستخدم</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>طريقة السحب</TableHead>
          <TableHead>التفاصيل</TableHead>
          <TableHead>تاريخ الطلب</TableHead>
          {status === 'معلق' && <TableHead className="text-right">إجراءات</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {withdrawals.map((withdrawal) => {
          const user = usersMap.get(withdrawal.userId);
          return (
          <TableRow key={withdrawal.id}>
            <TableCell>
              <div className="font-medium">{user?.name || 'مستخدم غير معروف'}</div>
              <div className="font-mono text-xs text-muted-foreground">{withdrawal.userId}</div>
            </TableCell>
            <TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
            <TableCell>{withdrawal.method}</TableCell>
            <TableCell className="font-mono text-xs">
              {withdrawal.details?.phoneNumber || withdrawal.details?.binanceId || 'N/A'}
            </TableCell>
            <TableCell>
              {new Date(withdrawal.requestDate).toLocaleString('ar-EG')}
            </TableCell>
            {status === 'معلق' && (
              <TableCell className="text-right">
                {loadingAction === withdrawal.id ? <Loader2 className="animate-spin mx-auto" /> : (
                  <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleWithdrawalAction(withdrawal, 'مقبول')} className="text-green-500 hover:border-green-500 hover:text-green-600">
                          <Check className="h-4 w-4"/>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleWithdrawalAction(withdrawal, 'مرفوض')} className="text-red-500 hover:border-red-500 hover:text-red-600">
                          <X className="h-4 w-4"/>
                      </Button>
                  </div>
                )}
              </TableCell>
            )}
          </TableRow>
        )})}
      </TableBody>
    </Table>
  )
}

export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
            <HandCoins className="h-8 w-8" />
            إدارة طلبات السحب
        </h1>
        <p className="text-muted-foreground">
          مراجعة طلبات سحب الأرباح الخاصة بالمسوقين والموافقة عليها أو رفضها.
        </p>
      </div>

      <Tabs defaultValue="معلق" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="معلق">طلبات معلقة</TabsTrigger>
            <TabsTrigger value="مقبول">طلبات مقبولة</TabsTrigger>
            <TabsTrigger value="مرفوض">طلبات مرفوضة</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-0">
            <TabsContent value="معلق" className="m-0">
              <WithdrawalTable status="معلق" />
            </TabsContent>
            <TabsContent value="مقبول" className="m-0">
              <WithdrawalTable status="مقبول" />
            </TabsContent>
            <TabsContent value="مرفوض" className="m-0">
              <WithdrawalTable status="مرفوض" />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
