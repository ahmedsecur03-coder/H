
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import {
  collectionGroup,
  query,
  doc,
  runTransaction,
  getDocs,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import type { AgencyChargeRequest, User, AgencyAccount, Notification } from '@/lib/types';

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
import { Check, X, Loader2, WalletCards } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { PLATFORM_ICONS } from '@/lib/icon-data';

type Status = 'معلق' | 'مقبول' | 'مرفوض';

function ChargeRequestsTable({ requests, isLoading, onAction, loadingActionId }: { requests: AgencyChargeRequest[], isLoading: boolean, onAction: (req: AgencyChargeRequest, newStatus: 'مقبول' | 'مرفوض') => void, loadingActionId: string | null }) {

  const status = requests.length > 0 ? requests[0].status : 'معلق';
  
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
       <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المستخدم</TableHead>
              <TableHead>الحساب</TableHead>
              <TableHead>المنصة</TableHead>
              <TableHead>المبلغ</TableHead>
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

  if (!requests || requests.length === 0) {
    return (
      <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
        لا توجد طلبات في هذا القسم.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المستخدم</TableHead>
          <TableHead>الحساب</TableHead>
          <TableHead>المنصة</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>تاريخ الطلب</TableHead>
          {status === 'معلق' && <TableHead className="text-right">إجراءات</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req) => {
          const Icon = PLATFORM_ICONS[req.platform] || PLATFORM_ICONS.Default;
          return (
          <TableRow key={req.id}>
            <TableCell>
              <Link href={`/admin/users?search=${req.userId}`} className="font-mono text-xs text-primary hover:underline">{req.userId}</Link>
            </TableCell>
            <TableCell>{req.accountName}</TableCell>
            <TableCell><Icon className="h-5 w-5 text-muted-foreground" /></TableCell>
            <TableCell className="font-semibold">${req.amount.toFixed(2)}</TableCell>
            <TableCell>{new Date(req.requestDate).toLocaleString('ar-EG')}</TableCell>
            {status === 'معلق' && (
              <TableCell className="text-right">
                {loadingActionId === req.id ? <Loader2 className="animate-spin mx-auto" /> : (
                  <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => onAction(req, 'مقبول')} className="text-green-500 hover:border-green-500 hover:text-green-600">
                          <Check className="h-4 w-4"/>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => onAction(req, 'مرفوض')} className="text-red-500 hover:border-red-500 hover:text-red-600">
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
    </div>
  )
}

export default function AdminAgencyChargesPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [allRequests, setAllRequests] = useState<AgencyChargeRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if(!firestore) return;
        setIsLoading(true);
        try {
            const requestsQuery = query(collectionGroup(firestore, 'agencyChargeRequests'));
            const snapshot = await getDocs(requestsQuery);
            const fetchedData = snapshot.docs.map(doc => {
                 const pathSegments = doc.ref.path.split('/');
                 const userId = pathSegments[1];
                 return { id: doc.id, userId, ...doc.data()} as AgencyChargeRequest
            });
            // Sort client-side
            fetchedData.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
            setAllRequests(fetchedData);
        } catch (error) {
             console.error("Error fetching agency charge requests:", error);
             toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب بيانات طلبات الشحن.'});
        } finally {
            setIsLoading(false);
        }
    }, [firestore, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleAction = async (req: AgencyChargeRequest, newStatus: 'مقبول' | 'مرفوض') => {
        if (!firestore) return;
        setLoadingActionId(req.id);
        
        const userRef = doc(firestore, 'users', req.userId);
        const requestDocRef = doc(firestore, `users/${req.userId}/agencyChargeRequests`, req.id);
        const accountDocRef = doc(firestore, `users/${req.userId}/agencyAccounts`, req.accountId);

        try {
            await runTransaction(firestore, async (transaction) => {
                // Update request status first
                transaction.update(requestDocRef, { status: newStatus });

                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error('المستخدم صاحب الطلب غير موجود.');
                const userData = userDoc.data() as User;
                
                if (newStatus === 'مقبول') {
                    const accountDoc = await transaction.get(accountDocRef);
                    if (!accountDoc.exists()) throw new Error('الحساب الإعلاني المراد شحنه غير موجود.');
                    
                    const currentAdBalance = userData.adBalance ?? 0;
                    if (currentAdBalance < req.amount) throw new Error('رصيد إعلانات المستخدم غير كافٍ.');

                    // Deduct from user's ad balance
                    transaction.update(userRef, { adBalance: increment(-req.amount) });
                    
                    // Add to agency account balance
                    transaction.update(accountDocRef, { balance: increment(req.amount) });
                    
                    // Send notification
                    const notification: Notification = {
                        id: `agency-charge-ok-${req.id}`,
                        message: `تم قبول طلب شحن حسابك "${req.accountName}" بمبلغ ${req.amount}$ وتمت إضافة الرصيد.`,
                        type: 'success',
                        read: false,
                        createdAt: new Date().toISOString(),
                        href: '/dashboard/agency-accounts'
                    };
                    transaction.update(userRef, { notifications: arrayUnion(notification) });

                } else { // newStatus is 'مرفوض'
                     const notification: Notification = {
                        id: `agency-charge-rej-${req.id}`,
                        message: `تم رفض طلب شحن حسابك "${req.accountName}" بمبلغ ${req.amount}$. يرجى مراجعة الدعم الفني.`,
                        type: 'error',
                        read: false,
                        createdAt: new Date().toISOString(),
                        href: '/dashboard/agency-accounts'
                    };
                    transaction.update(userRef, { notifications: arrayUnion(notification) });
                }
            });
          
            // Optimistically update UI
            setAllRequests(prev => prev.map(d => d.id === req.id ? {...d, status: newStatus} : d));
            toast({ title: 'نجاح', description: `تم ${newStatus === 'مقبول' ? 'قبول' : 'رفض'} الطلب بنجاح.` });

        } catch (error: any) {
            console.error("Agency Charge Action Error:", error);
            toast({ variant: 'destructive', title: 'فشل الإجراء', description: error.message || 'حدث خطأ أثناء معالجة الطلب.' });
            const permissionError = new FirestorePermissionError({ path: userRef.path, operation: 'update' });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
          setLoadingActionId(null);
        }
    };

    const filteredRequests = useMemo(() => {
        return {
            pending: allRequests.filter(d => d.status === 'معلق'),
            approved: allRequests.filter(d => d.status === 'مقبول'),
            rejected: allRequests.filter(d => d.status === 'مرفوض'),
        }
    }, [allRequests]);


  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2"><WalletCards className="h-8 w-8" /> إدارة شحن حسابات الوكالة</h1>
        <p className="text-muted-foreground">مراجعة طلبات شحن أرصدة حسابات الوكالة الإعلانية للمستخدمين.</p>
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
              <ChargeRequestsTable requests={filteredRequests.pending} isLoading={isLoading} onAction={handleAction} loadingActionId={loadingActionId} />
            </TabsContent>
            <TabsContent value="مقبول" className="m-0">
              <ChargeRequestsTable requests={filteredRequests.approved} isLoading={isLoading} onAction={handleAction} loadingActionId={loadingActionId} />
            </TabsContent>
            <TabsContent value="مرفوض" className="m-0">
              <ChargeRequestsTable requests={filteredRequests.rejected} isLoading={isLoading} onAction={handleAction} loadingActionId={loadingActionId} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
