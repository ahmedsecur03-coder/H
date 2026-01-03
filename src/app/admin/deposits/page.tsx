'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import {
  collectionGroup,
  query,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import type { Deposit } from '@/lib/types';
import { handleAdminAction } from '@/app/admin/_actions/admin-actions';
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
import { Check, X, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Status = 'معلق' | 'مقبول' | 'مرفوض';


function DepositTable({ deposits, isLoading, onAction, loadingActionId, onDelete }: { deposits: Deposit[], isLoading: boolean, onAction: (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => void, loadingActionId: string | null, onDelete: (deposit: Deposit) => void }) {

  const status = deposits.length > 0 ? deposits[0].status : 'معلق';
  
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>طريقة الدفع</TableHead>
              <TableHead>التفاصيل</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({length: 5}).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({length: 6}).map((_, j) => (
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
          <TableHead>معرف المستخدم</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>طريقة الدفع</TableHead>
          <TableHead>التفاصيل</TableHead>
          <TableHead>التاريخ</TableHead>
          <TableHead className="text-right">إجراءات</TableHead>
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
            <TableCell className="text-right">
              {loadingActionId === deposit.id ? <Loader2 className="animate-spin mx-auto" /> : (
                <div className="flex justify-end gap-2">
                    {status === 'معلق' && (
                        <>
                        <Button variant="outline" size="icon" onClick={() => onAction(deposit, 'مقبول')} className="text-green-500 hover:border-green-500 hover:text-green-600">
                            <Check className="h-4 w-4"/>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onAction(deposit, 'مرفوض')} className="text-red-500 hover:border-red-500 hover:text-red-600">
                            <X className="h-4 w-4"/>
                        </Button>
                        </>
                    )}
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد أنك تريد حذف هذا الإيداع؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(deposit)}>حذف</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              )}
            </TableCell>
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
    const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

    const fetchAllData = useCallback(async () => {
        if(!firestore) return;
        setIsLoading(true);
        try {
            const depositsQuery = query(collectionGroup(firestore, 'deposits'));
            const snapshot = await getDocs(depositsQuery);
            const fetchedData = snapshot.docs.map(doc => {
                 const pathSegments = doc.ref.path.split('/');
                 const userId = pathSegments[1];
                 return { id: doc.id, userId, ...doc.data()} as Deposit
            });
            // Sort client-side
            fetchedData.sort((a, b) => new Date(b.depositDate).getTime() - new Date(a.depositDate).getTime());
            setAllDeposits(fetchedData);
        } catch (error) {
             console.error("Error fetching all deposits:", error);
             toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات الإيداعات.'});
        } finally {
            setIsLoading(false);
        }
    }, [firestore, toast]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);


    const handleDepositAction = async (deposit: Deposit, newStatus: 'مقبول' | 'مرفوض') => {
        setLoadingActionId(deposit.id);
        
        try {
            const result = await handleAdminAction({
                action: 'handle-deposit',
                payload: {
                    userId: deposit.userId,
                    depositId: deposit.id,
                    amount: deposit.amount,
                    newStatus: newStatus
                }
            });

            if (result.success) {
                 toast({
                    title: 'نجاح',
                    description: `تم ${newStatus === 'مقبول' ? 'قبول' : 'رفض'} طلب الإيداع بنجاح.`,
                });
                await fetchAllData();
            } else {
                throw new Error(result.error || 'فشل الإجراء من الخادم.');
            }
        } catch (error: any) {
            console.error("Deposit Action Error:", error);
            toast({
                variant: 'destructive',
                title: 'فشل الإجراء',
                description: error.message || 'حدث خطأ أثناء معالجة الطلب.',
            });
        } finally {
          setLoadingActionId(null);
        }
    };
  
    const handleDelete = async (deposit: Deposit) => {
        if (!firestore) return;
        setLoadingActionId(deposit.id);
        try {
            const result = await handleAdminAction({
                action: 'delete-document',
                payload: {
                    path: `users/${deposit.userId}/deposits/${deposit.id}`
                }
            });
             if (result.success) {
                toast({ title: 'نجاح', description: 'تم حذف الإيداع بنجاح.' });
                await fetchAllData();
            } else {
                throw new Error(result.error || 'فشل الحذف من الخادم.');
            }
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'فشل الحذف', description: error.message || 'حدث خطأ أثناء محاولة الحذف.'});
        } finally {
            setLoadingActionId(null);
        }
    }


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
                <DepositTable deposits={filteredDeposits.pending} isLoading={isLoading} onAction={handleDepositAction} loadingActionId={loadingActionId} onDelete={handleDelete} />
                </TabsContent>
                <TabsContent value="مقبول" className="m-0">
                <DepositTable deposits={filteredDeposits.approved} isLoading={isLoading} onAction={handleDepositAction} loadingActionId={loadingActionId} onDelete={handleDelete} />
                </TabsContent>
                <TabsContent value="مرفوض" className="m-0">
                <DepositTable deposits={filteredDeposits.rejected} isLoading={isLoading} onAction={handleDepositAction} loadingActionId={loadingActionId} onDelete={handleDelete} />
                </TabsContent>
            </CardContent>
            </Card>
        </Tabs>
        </div>
    );
}
