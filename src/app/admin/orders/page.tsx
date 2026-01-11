
'use client';

import { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, orderBy, where, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData, deleteDoc, doc, Query, getCountFromServer } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ListFilter, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { OrderActions } from './_components/order-actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FirestorePermissionError, errorEmitter } from '@/firebase';

const statusVariant = {
  'مكتمل': 'default',
  'قيد التنفيذ': 'secondary',
  'ملغي': 'destructive',
  'جزئي': 'outline',
} as const;

const STATUS_OPTIONS: (keyof typeof statusVariant)[] = [
  'مكتمل',
  'قيد التنفيذ',
  'ملغي',
  'جزئي',
];

const ITEMS_PER_PAGE = 15;

function OrdersPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <Card>
                <CardHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {Array.from({ length: 7 }).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 <CardFooter className="justify-center border-t pt-4">
                    <Skeleton className="h-9 w-32" />
                 </CardFooter>
            </Card>
        </div>
    );
}

function AdminOrdersPageComponent() {
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentStatus = searchParams.get('status') || 'all';
  const currentSearch = searchParams.get('search') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);


  const fetchOrders = useCallback(async (pageDirection: 'next' | 'prev' | 'current' = 'current') => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        let q: Query = collectionGroup(firestore, 'orders');
        
        // Apply filtering
        if (currentStatus !== 'all') {
            q = query(q, where('status', '==', currentStatus));
        }

        q = query(q, orderBy('orderDate', 'desc'));
        
        // Apply pagination
        if (pageDirection === 'next' && lastVisible) {
            q = query(q, startAfter(lastVisible));
        } else if (pageDirection === 'prev' && firstVisible) {
            q = query(q, endBefore(firstVisible), limitToLast(ITEMS_PER_PAGE));
        } else {
            q = query(q, limit(ITEMS_PER_PAGE));
        }
        
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                userId: doc.ref.parent.parent!.id, // Get userId from path
                ...doc.data()
            } as Order));

            setOrders(ordersData);
            setFirstVisible(snapshot.docs[0]);
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            
            // Check for next page
            let nextQuery = query(collectionGroup(firestore, 'orders'), orderBy('orderDate', 'desc'), startAfter(snapshot.docs[snapshot.docs.length - 1]), limit(1));
            if (currentStatus !== 'all') {
                nextQuery = query(nextQuery, where('status', '==', currentStatus));
            }
            const nextSnapshot = await getDocs(nextQuery);
            setIsNextPageAvailable(!nextSnapshot.empty);

        } else {
            if(pageDirection === 'current') {
                setOrders([]);
            }
             if (pageDirection === 'next') {
                 setIsNextPageAvailable(false);
            }
        }

    } catch(error) {
        console.error("Failed to fetch orders:", error);
        toast({ variant: 'destructive', title: "Error", description: 'Could not fetch orders.'})
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast, currentStatus, lastVisible, firstVisible]);

  useEffect(() => {
    // Reset pagination state when filters change
    setFirstVisible(null);
    setLastVisible(null);
    fetchOrders('current');
  }, [currentStatus, currentSearch, fetchOrders]);
  
  const handlePageChange = (direction: 'next' | 'prev') => {
      const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
       const params = new URLSearchParams(searchParams.toString());
       params.set('page', String(newPage));
       router.replace(`${pathname}?${params.toString()}`);
       fetchOrders(direction);
  }

  const handleDelete = async (order: Order) => {
    if (!firestore) return;
    const orderDocRef = doc(firestore, `users/${order.userId}/orders`, order.id);
    try {
        await deleteDoc(orderDocRef);
        toast({ title: 'نجاح', description: 'تم حذف الطلب بنجاح.' });
        fetchOrders('current');
    } catch (error) {
         const permissionError = new FirestorePermissionError({
            path: orderDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }


  const filteredOrders = useMemo(() => {
    if (!currentSearch) return orders;
    return orders.filter(order => 
        order.id.toLowerCase().includes(currentSearch.toLowerCase()) ||
        order.userId.toLowerCase().includes(currentSearch.toLowerCase()) ||
        order.serviceName.toLowerCase().includes(currentSearch.toLowerCase()) ||
        (order.link && order.link.toLowerCase().includes(currentSearch.toLowerCase()))
    );
  }, [orders, currentSearch]);

  const handleFilterChange = (key: 'search' | 'status', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Always reset page to 1 when search or status filters change
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };
  
  const OrderCard = ({ order }: { order: Order }) => (
    <Card>
      <CardHeader>
        <div className='flex justify-between items-start'>
          <CardTitle className="text-sm font-medium leading-tight">{order.serviceName}</CardTitle>
          <Badge variant={statusVariant[order.status as keyof typeof statusVariant] || 'default'}>{order.status}</Badge>
        </div>
        <CardDescription className="font-mono text-xs pt-1">{order.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">المستخدم</span>
          <Link href={`/admin/users?search=${order.userId}`} className="font-mono text-xs text-primary hover:underline">{order.userId}</Link>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">التكلفة</span>
          <span className="font-semibold">${order.charge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">الرابط</span>
           <a href={order.link} className="text-primary hover:underline truncate block max-w-[150px]" target="_blank">{order.link}</a>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <OrderActions order={order} onOrderUpdate={() => fetchOrders('current')} />
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1">حذف</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(order)}>حذف</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );

  if (isLoading && orders.length === 0) {
    return <OrdersPageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الطلبات</h1>
        <p className="text-muted-foreground">
          عرض وتعديل جميع طلبات SMM في النظام.
        </p>
      </div>

       <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالمعرف، المستخدم، أو الرابط..."
                className="pe-10 rtl:ps-10"
                defaultValue={currentSearch}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <Select defaultValue={currentStatus} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="فلترة حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? <OrdersPageSkeleton /> : filteredOrders.length > 0 ? (
        <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
                {filteredOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>

            {/* Desktop View */}
            <Card className="hidden md:block">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>المعرف</TableHead>
                        <TableHead>المستخدم</TableHead>
                        <TableHead>الخدمة</TableHead>
                        <TableHead>الرابط</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-right">التكلفة</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.id.substring(0,8)}...</TableCell>
                            <TableCell>
                               <Link href={`/admin/users?search=${order.userId}`} className="font-mono text-xs text-primary hover:underline">{order.userId.substring(0,8)}...</Link>
                            </TableCell>
                            <TableCell className="font-medium">{order.serviceName}</TableCell>
                            <TableCell><a href={order.link} className="text-primary hover:underline truncate block max-w-xs" target="_blank">{order.link}</a></TableCell>
                            <TableCell>
                                <Badge variant={statusVariant[order.status as keyof typeof statusVariant] || 'default'}>{order.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">${order.charge.toFixed(2)}</TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-2">
                                <OrderActions order={order} onOrderUpdate={() => fetchOrders('current')} />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(order)}>حذف</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
            </Card>
             <Pagination>
                <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange('prev'); }} disabled={currentPage === 1}/>
                </PaginationItem>
                <PaginationItem>
                    <span className="p-2 text-sm">صفحة {currentPage}</span>
                </PaginationItem>
                <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange('next'); }} disabled={!isNextPageAvailable} />
                </PaginationItem>
                </PaginationContent>
            </Pagination>
        </>
      ) : (
        <Card className="flex flex-col items-center justify-center py-20 text-center">
            <CardHeader>
                <div className="mx-auto bg-muted p-4 rounded-full">
                    <ListFilter className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4 font-headline text-2xl">لا توجد طلبات تطابق بحثك</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    حاول تغيير فلاتر البحث أو التأكد من وجود طلبات.
                </p>
                <Button variant="outline" onClick={() => router.replace(pathname)} className="mt-4">
                  إعادة تعيين الفلاتر
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={<OrdersPageSkeleton />}>
            <AdminOrdersPageComponent />
        </Suspense>
    )
}
