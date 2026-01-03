'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import {
  collectionGroup,
  query,
  getDocs,
  runTransaction,
  doc,
  increment,
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
import Link from 'next/link';


type Status = 'معلق' | 'مقبول' | 'مرفوض';

function WithdrawalTable({ withdrawals, isLoading, onAction, loadingActionId }: { withdrawals: Withdrawal[], isLoading: boolean, onAction: (withdrawal: Withdrawal, newStatus: 'مقبول' | 'مرفوض') => void, loadingActionId: string | null }) {
  
  const status = withdrawals.length > 0 ? withdrawals[0].status : 'معلق';
  
  if (isLoading) {
    return (
        <div className="overflow-x-auto">
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
       </div>
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
    <div className="overflow-x-auto">
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
        {withdrawals.map((withdrawal) => (
          <TableRow key={withdrawal.id}>
            <TableCell>
              <Link href={`/admin/users?search=${withdrawal.userId}`} className="font-mono text-xs text-primary hover:underline">{withdrawal.userId}</Link>
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
                {loadingActionId === withdrawal.id ? <Loader2 className="animate-spin mx-auto" /> : (
                  <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => onAction(withdrawal, 'مقبول')} className="text-green-500 hover:border-green-500 hover:text-green-600">
                          <Check className="h-4 w-4"/>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => onAction(withdrawal, 'مرفوض')} className="text-red-500 hover:border-red-500 hover:text-red-600">
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
    </div>
  )
}

export default function AdminWithdrawalsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

    const fetchAllData = useCallback(async () => {
        if (!firestore) return;
        setIsLoading(true);
        try {
            const withdrawalsQuery = query(collectionGroup(firestore, 'withdrawals'));
            const snapshot = await getDocs(withdrawalsQuery);
            const fetchedData = snapshot.docs.map(doc => {
                const pathSegments = doc.ref.path.split('/');
                const userId = pathSegments[1];
                return { id: doc.id, userId, ...doc.data() } as Withdrawal;
            });
            // Sort client-side
            fetchedData.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
            setAllWithdrawals(fetchedData);
        } catch (err) {
            console.error("Error fetching all withdrawals: ", err);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات طلبات السحب.' });
        } finally {
            setIsLoading(false);
        }
    }, [firestore, toast]);
    
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleWithdrawalAction = async (withdrawal: Withdrawal, newStatus: 'مقبول' | 'مرفوض') => {
        if (!firestore) return;
        setLoadingActionId(withdrawal.id);
        const { userId, id: withdrawalId, amount } = withdrawal;

        const userRef = doc(firestore, 'users', userId);
        const withdrawalDocRef = doc(firestore, `users/${userId}/withdrawals`, withdrawalId);

        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error('المستخدم غير موجود.');
                
                transaction.update(withdrawalDocRef, { status: newStatus });

                if (newStatus === 'مقبول') {
                    const userData = userDoc.data() as User;
                    if ((userData.affiliateEarnings ?? 0) < amount) {
                        throw new Error('رصيد أرباح المستخدم غير كافٍ.');
                    }
                    transaction.update(userRef, { affiliateEarnings: increment(-amount) });
                }
                // No action needed for 'مرفوض' besides updating status
            });
            toast({ title: 'نجاح', description: `تم ${newStatus === 'مقبول' ? 'قبول' : 'رفض'} طلب السحب بنجاح.` });
            await fetchAllData();
        } catch (error: any) {
            const isPermissionError = error.code === 'permission-denied';
            if (isPermissionError) {
                const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'update' });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Withdrawal Action Error:", error);
                toast({ variant: 'destructive', title: 'فشل الإجراء', description: error.message });
            }
        } finally {
          setLoadingActionId(null);
        }
    };
  
    const filteredWithdrawals = useMemo(() => {
        return {
            pending: allWithdrawals.filter(d => d.status === 'معلق'),
            approved: allWithdrawals.filter(d => d.status === 'مقبول'),
            rejected: allWithdrawals.filter(d => d.status === 'مرفوض'),
        }
    }, [allWithdrawals]);

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
              <WithdrawalTable withdrawals={filteredWithdrawals.pending} isLoading={isLoading} onAction={handleWithdrawalAction} loadingActionId={loadingActionId} />
            </TabsContent>
            <TabsContent value="مقبول" className="m-0">
              <WithdrawalTable withdrawals={filteredWithdrawals.approved} isLoading={isLoading} onAction={handleWithdrawalAction} loadingActionId={loadingActionId} />
            </TabsContent>
            <TabsContent value="مرفوض" className="m-0">
              <WithdrawalTable withdrawals={filteredWithdrawals.rejected} isLoading={isLoading} onAction={handleWithdrawalAction} loadingActionId={loadingActionId} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

    