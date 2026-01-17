

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
  arrayUnion,
  orderBy,
  where
} from 'firebase/firestore';
import type { Deposit, User, Notification } from '@/lib/types';
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
import { Check, X, Loader2, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { AFFILIATE_LEVELS } from '@/lib/service';

type Status = 'معلق' | 'مقبول' | 'مرفوض';

function DepositsTable({ deposits, isLoading, onAction, loadingActionId }: { deposits: Deposit[], isLoading: boolean, onAction: (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => void, loadingActionId: string | null }) {

  const status = deposits.length > 0 ? deposits[0].status : 'معلق';
  
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>الطريقة</TableHead>
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

  if (!deposits || deposits.length === 0) {
    return (
      <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
        لا توجد طلبات إيداع في هذا القسم.
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
          <TableHead>الطريقة</TableHead>
          <TableHead>التفاصيل</TableHead>
          <TableHead>تاريخ الطلب</TableHead>
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
              {deposit.details?.senderNumber || deposit.details?.transactionId || 'N/A'}
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
    </div>
  )
}

export default function AdminDepositsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<Status>('معلق');
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if(!firestore) return;
        setIsLoading(true);
        try {
            const depositsQuery = query(
              collectionGroup(firestore, 'deposits'), 
              where('status', '==', activeTab),
              orderBy('depositDate', 'desc')
            );
            const snapshot = await getDocs(depositsQuery);
            const fetchedData = snapshot.docs.map(doc => {
                 const pathSegments = doc.ref.path.split('/');
                 const userId = pathSegments[1];
                 return { id: doc.id, userId, ...doc.data()} as Deposit
            });
            setDeposits(fetchedData);
        } catch (error) {
             console.error("Error fetching deposits:", error);
             toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات الإيداعات. قد تحتاج لإنشاء فهرس في Firestore.'});
        } finally {
            setIsLoading(false);
        }
    }, [firestore, toast, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDepositAction = async (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => {
        if (!firestore) return;
        setLoadingActionId(deposit.id);
        const { userId, id: depositId, amount } = deposit;

        const userRef = doc(firestore, 'users', userId);
        const depositDocRef = doc(firestore, `users/${userId}/deposits`, depositId);
        
        try {
            await runTransaction(firestore, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error('المستخدم صاحب الطلب غير موجود.');
                
                transaction.update(depositDocRef, { status: newStatus });
                
                if (newStatus === 'مقبول') {
                    // Update user's balance and total spent
                    transaction.update(userRef, {
                        balance: increment(amount),
                        totalSpent: increment(amount)
                    });
                    
                    // Add notification for the user
                     const notification: Notification = {
                        id: `deposit-ok-${depositId}`,
                        message: `تمت إضافة ${amount}$ إلى رصيدك بنجاح.`,
                        type: 'success', read: false, createdAt: new Date().toISOString(), href: '/dashboard/add-funds'
                    };
                    transaction.update(userRef, { notifications: arrayUnion(notification) });

                    // Handle affiliate commission logic if a referrer exists
                    const userData = userDoc.data() as User;
                    if (userData.referrerId) {
                        const referrerRef = doc(firestore, 'users', userData.referrerId);
                        const referrerDoc = await transaction.get(referrerRef); // Use transaction.get
                        if (referrerDoc.exists()) {
                            const referrerData = referrerDoc.data() as User;
                            const levelKey = referrerData.affiliateLevel || 'برونزي';
                            const commissionRate = AFFILIATE_LEVELS[levelKey].commission / 100;
                            const commissionAmount = amount * commissionRate;
                            
                            transaction.update(referrerRef, { affiliateEarnings: increment(commissionAmount) });
                        }
                    }

                } else { // Rejected
                    const notification: Notification = {
                        id: `deposit-rej-${depositId}`,
                        message: `تم رفض طلب إيداعك بمبلغ ${amount}$. يرجى مراجعة الدعم الفني.`,
                        type: 'error', read: false, createdAt: new Date().toISOString(), href: '/dashboard/support'
                    };
                    transaction.update(userRef, { notifications: arrayUnion(notification) });
                }
            });

            toast({ title: 'نجاح', description: `تم ${newStatus === 'مقبول' ? 'قبول' : 'رفض'} الطلب بنجاح.` });
            await fetchData();

        } catch (error: any) {
             const isPermissionError = error.code === 'permission-denied';
             if (isPermissionError) {
                const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'update' });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error("Deposit Action Error:", error);
                toast({ variant: 'destructive', title: 'فشل الإجراء', description: error.message });
            }
        } finally {
          setLoadingActionId(null);
        }
    };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><Banknote className="h-8 w-8" /> إدارة الإيداعات</h1>
        <p className="text-muted-foreground">مراجعة طلبات الإيداع اليدوية والموافقة عليها.</p>
      </div>

      <Tabs defaultValue="معلق" className="w-full" onValueChange={(value) => setActiveTab(value as Status)}>
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="معلق">طلبات معلقة</TabsTrigger>
            <TabsTrigger value="مقبول">طلبات مقبولة</TabsTrigger>
            <TabsTrigger value="مرفوض">طلبات مرفوضة</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-0">
             <DepositsTable deposits={deposits} isLoading={isLoading} onAction={handleDepositAction} loadingActionId={loadingActionId} />
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
