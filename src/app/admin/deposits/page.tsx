
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import {
  collectionGroup,
  query,
  where,
  doc,
  runTransaction,
  orderBy,
  Query,
  collection,
  getDocs,
  limit,
  arrayUnion
} from 'firebase/firestore';
import type { Deposit, User } from '@/lib/types';

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
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Status = 'معلق' | 'مقبول' | 'مرفوض';

function DepositTable({ status }: { status: Status }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the query to prevent re-creating it on every render
  const depositsQuery = useMemoFirebase(
    () => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'deposits'), 
            where('status', '==', status), 
            orderBy('depositDate', 'desc'),
            limit(100) // Limit to a reasonable number for display
        );
    },
    [firestore, status]
  );
  
  const fetchDeposits = async () => {
    if (!depositsQuery) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

    try {
      const snapshot = await getDocs(depositsQuery);
      const fetchedDeposits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deposit));
      setDeposits(fetchedDeposits);
    } catch(err) {
        console.error("Error fetching deposits: ", err);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب طلبات الإيداع.' });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [depositsQuery]);


  const handleDepositAction = async (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => {
    if (!firestore) return;
    setLoadingAction(deposit.id);
    const userDocRef = doc(firestore, 'users', deposit.userId);
    const depositDocRef = doc(firestore, `users/${deposit.userId}/deposits`, deposit.id);

    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
            throw new Error('المستخدم غير موجود.');
        }

        const userUpdates: any = {};
        
        if (newStatus === 'مقبول') {
            const currentBalance = userDoc.data().balance ?? 0;
            userUpdates.balance = currentBalance + deposit.amount;
            userUpdates.notifications = arrayUnion({
                id: `dep-${deposit.id}`,
                message: `تم قبول طلب الإيداع الخاص بك بقيمة ${deposit.amount}$ وتمت إضافة الرصيد إلى حسابك.`,
                type: 'success',
                read: false,
                createdAt: new Date().toISOString(),
                href: '/dashboard/add-funds'
            });
            transaction.update(userDocRef, userUpdates);
        }
        
        // Always update the deposit document's status
        transaction.update(depositDocRef, { status: newStatus });
      });
      
      // Manually update local state to reflect the change immediately
      setDeposits(prev => prev.filter(d => d.id !== deposit.id));

      toast({
        title: 'نجاح',
        description: `تم ${newStatus === 'مقبول' ? 'قبول' : 'رفض'} طلب الإيداع بنجاح.`,
      });
    } catch (error: any) {
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
              <TableHead>طريقة الدفع</TableHead>
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

  if (!deposits || deposits.length === 0) {
    return (
      <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
        لا توجد طلبات إيداع في هذا القسم.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>معرف المستخدم</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>طريقة الدفع</TableHead>
          <TableHead>التفاصيل</TableHead>
          <TableHead>التاريخ</TableHead>
          {status === 'معلق' && <TableHead className="text-right">إجراءات</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {deposits.map((deposit) => (
          <TableRow key={deposit.id}>
            <TableCell>
              <div className="font-mono text-xs text-muted-foreground">{deposit.userId}</div>
            </TableCell>
            <TableCell>${deposit.amount.toFixed(2)}</TableCell>
            <TableCell>{deposit.paymentMethod}</TableCell>
            <TableCell className="font-mono text-xs">
              {deposit.details?.phoneNumber || deposit.details?.transactionId || 'N/A'}
            </TableCell>
            <TableCell>
              {new Date(deposit.depositDate).toLocaleString('ar-EG')}
            </TableCell>
            {status === 'معلق' && (
              <TableCell className="text-right">
                {loadingAction === deposit.id ? <Loader2 className="animate-spin mx-auto" /> : (
                  <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleDepositAction(deposit, 'مقبول')} className="text-green-500 hover:border-green-500 hover:text-green-600">
                          <Check className="h-4 w-4"/>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDepositAction(deposit, 'مرفوض')} className="text-red-500 hover:border-red-500 hover:text-red-600">
                          <X className="h-4 w-4"/>
                      </Button>
                  </div>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function AdminDepositsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الإيداعات</h1>
        <p className="text-muted-foreground">
          مراجعة طلبات الإيداع والموافقة عليها أو رفضها.
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
              <DepositTable status="معلق" />
            </TabsContent>
            <TabsContent value="مقبول" className="m-0">
              <DepositTable status="مقبول" />
            </TabsContent>
            <TabsContent value="مرفوض" className="m-0">
              <DepositTable status="مرفوض" />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
