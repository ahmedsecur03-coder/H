
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
  arrayUnion,
  increment,
  Timestamp,
} from 'firebase/firestore';
import type { Deposit, User } from '@/lib/types';

import {
  Card,
  CardContent,
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
import Link from 'next/link';

type Status = 'معلق' | 'مقبول' | 'مرفوض';

// Commission rates based on original deposit amount
const COMMISSION_RATES = [
    0.20, // Level 1: 20%
    0.10, // Level 2: 10%
    0.05, // Level 3: 5%
    0.03, // Level 4: 3%
    0.02, // Level 5: 2%
    0.01, // Level 6: 1%
];


function DepositTable({ deposits, isLoading, onAction, loadingActionId }: { deposits: Deposit[], isLoading: boolean, onAction: (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => void, loadingActionId: string | null }) {

  const status = deposits.length > 0 ? deposits[0].status : 'معلق';
  
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
              <Link href={`/admin/users?search=${deposit.userId}`} className="font-mono text-xs text-primary hover:underline">{deposit.userId}</Link>
            </TableCell>
            <TableCell>${deposit.amount.toFixed(2)}</TableCell>
            <TableCell>{deposit.paymentMethod}</TableCell>
            <TableCell className="font-mono text-xs">
              {deposit.details?.phoneNumber || deposit.details?.transactionId || deposit.details?.binanceId || 'N/A'}
            </TableCell>
            <TableCell>
              {new Date(deposit.depositDate).toLocaleString('ar-EG')}
            </TableCell>
            {status === 'معلق' && (
              <TableCell className="text-right">
                {loadingActionId === deposit.id ? <Loader2 className="animate-spin mx-auto" /> : (
                  <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => onAction(deposit, 'مقبول')} className="text-green-500 hover:border-green-500 hover:text-green-600">
                          <Check className="h-4 w-4"/>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => onAction(deposit, 'مرفوض')} className="text-red-500 hover:border-red-500 hover:text-red-600">
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
    const firestore = useFirestore();
    const { toast } = useToast();
    const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

    const fetchAllData = async () => {
        if(!firestore) return;
        setIsLoading(true);
        try {
            const depositsQuery = query(collectionGroup(firestore, 'deposits'), orderBy('depositDate', 'desc'), limit(300));
            const snapshot = await getDocs(depositsQuery);
            const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as Deposit));
            setAllDeposits(fetchedData);
        } catch (error) {
            console.error("Error fetching all deposits:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات الإيداعات.'});
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchAllData();
    }, [firestore]);


    const handleDepositAction = async (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => {
        if (!firestore) return;
        setLoadingActionId(deposit.id);
        
        const depositorRef = doc(firestore, 'users', deposit.userId);
        const depositDocRef = doc(firestore, `users/${deposit.userId}/deposits`, deposit.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const depositorDoc = await transaction.get(depositorRef);
                if (!depositorDoc.exists()) {
                    throw new Error('المستخدم صاحب الإيداع غير موجود.');
                }
                const depositorData = depositorDoc.data() as User;

                // Update deposit status first
                transaction.update(depositDocRef, { status: newStatus });
                
                if (newStatus === 'مقبول') {
                    // 1. Add balance to the depositor's account
                    const newBalance = (depositorData.balance ?? 0) + deposit.amount;
                    transaction.update(depositorRef, { 
                        balance: newBalance,
                        totalSpent: increment(deposit.amount), // Also increment totalSpent
                        notifications: arrayUnion({
                            id: `dep-${deposit.id}`,
                            message: `تم قبول طلب الإيداع الخاص بك بقيمة ${deposit.amount}$ وتمت إضافة الرصيد إلى حسابك.`,
                            type: 'success',
                            read: false,
                            createdAt: new Date().toISOString(),
                            href: '/dashboard/add-funds'
                        })
                    });

                    // 2. Handle Affiliate Commissions
                    let currentReferrerId = depositorData.referrerId;

                    for (let level = 0; level < COMMISSION_RATES.length && currentReferrerId; level++) {
                        const commissionRate = COMMISSION_RATES[level];
                        const commissionAmount = deposit.amount * commissionRate;
                        
                        const referrerRef = doc(firestore, 'users', currentReferrerId);
                        transaction.update(referrerRef, { affiliateEarnings: increment(commissionAmount) });

                        // Log the transaction
                        const newTransactionRef = doc(collection(firestore, `users/${currentReferrerId}/affiliateTransactions`));
                        transaction.set(newTransactionRef, {
                            userId: currentReferrerId,
                            referralId: deposit.userId,
                            orderId: deposit.id,
                            amount: commissionAmount,
                            transactionDate: new Date().toISOString(),
                            level: level + 1,
                        });
                        
                        // Get the next referrer up the chain
                        const referrerDoc = await transaction.get(referrerRef);
                        if (referrerDoc.exists()) {
                            currentReferrerId = (referrerDoc.data() as User).referrerId;
                        } else {
                            break; // End of the chain
                        }
                    }

                } else { // newStatus is 'مرفوض'
                     transaction.update(depositorRef, { 
                        notifications: arrayUnion({
                            id: `dep-${deposit.id}-rej`,
                            message: `تم رفض طلب الإيداع الخاص بك بقيمة ${deposit.amount}$. يرجى مراجعة الدعم الفني.`,
                            type: 'error',
                            read: false,
                            createdAt: new Date().toISOString(),
                            href: '/dashboard/add-funds'
                        })
                    });
                }
            });
          
            // Optimistically update UI
            setAllDeposits(prev => prev.map(d => d.id === deposit.id ? {...d, status: newStatus} : d));

            toast({
                title: 'نجاح',
                description: `تم ${newStatus === 'مقبول' ? 'قبول' : 'رفض'} طلب الإيداع بنجاح.`,
            });
        } catch (error: any) {
            console.error("Deposit Action Error:", error);
            toast({
                variant: 'destructive',
                title: 'فشل الإجراء',
                description: error.message || 'حدث خطأ أثناء معالجة الطلب. قد يكون بسبب الصلاحيات.',
            });
            const permissionError = new FirestorePermissionError({
                path: depositorRef.path,
                operation: 'update',
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
          setLoadingActionId(null);
        }
  };

  const filteredDeposits = useMemo(() => {
    return {
        pending: allDeposits.filter(d => d.status === 'معلق'),
        approved: allDeposits.filter(d => d.status === 'مقبول'),
        rejected: allDeposits.filter(d => d.status === 'مرفوض'),
    }
  }, [allDeposits]);


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
              <DepositTable deposits={filteredDeposits.pending} isLoading={isLoading} onAction={handleDepositAction} loadingActionId={loadingActionId} />
            </TabsContent>
            <TabsContent value="مقبول" className="m-0">
              <DepositTable deposits={filteredDeposits.approved} isLoading={isLoading} onAction={handleDepositAction} loadingActionId={loadingActionId} />
            </TabsContent>
            <TabsContent value="مرفوض" className="m-0">
              <DepositTable deposits={filteredDeposits.rejected} isLoading={isLoading} onAction={handleDepositAction} loadingActionId={loadingActionId} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
