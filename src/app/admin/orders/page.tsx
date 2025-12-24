'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, where, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData, Query, DocumentSnapshot } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderActions } from './_components/order-actions';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ListFilter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from 'use-debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';


const statusVariant = {
  مكتمل: 'default',
  'قيد التنفيذ': 'secondary',
  ملغي: 'destructive',
  جزئي: 'outline',
} as const;

const STATUS_OPTIONS: (keyof typeof statusVariant)[] = ['مكتمل', 'قيد التنفيذ', 'ملغي', 'جزئي'];
const ITEMS_PER_PAGE = 25;

function OrdersPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-9 w-1/4" />
                <Skeleton className="h-5 w-1/2 mt-2" />
            </div>
            <Card>
                <CardHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {Array.from({ length: 7 }).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 15 }).map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="justify-center border-t pt-4">
                    <Skeleton className="h-9 w-64" />
                </CardFooter>
            </Card>
        </div>
    );
}

function AdminOrdersPageComponent() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [firstVisible, setFirstVisible] = useState<DocumentSnapshot | null>(null);
    const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(true);

    const currentStatus = searchParams.get('status') || 'all';
    const currentSearch = searchParams.get('search') || '';

    const [debouncedSearch] = useDebounce(currentSearch, 500);

     const fetchOrders = useCallback(async (direction: 'next' | 'prev' | 'first' = 'first') => {
        if (!firestore) return;
        setIsLoading(true);

        let q: Query = collectionGroup(firestore, 'orders');

        if (currentStatus !== 'all') {
            q = query(q, where('status', '==', currentStatus));
        }
        
        // Note: Firestore does not support inequality filters on different fields. 
        // A robust search would require a dedicated search service like Algolia or Typesense.
        // This client-side filter is a fallback for the debounced search term.
        
        q = query(q, orderBy('orderDate', 'desc'));

        if (direction === 'next' && lastVisible) {
            q = query(q, startAfter(lastVisible));
        } else if (direction === 'prev' && firstVisible) {
            q = query(q, endBefore(firstVisible), limitToLast(ITEMS_PER_PAGE));
        } else {
             q = query(q, limit(ITEMS_PER_PAGE));
        }

        try {
            const documentSnapshots = await getDocs(q);
            let newOrders = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            
            if (debouncedSearch) {
                newOrders = newOrders.filter(order =>
                    order.userId.includes(debouncedSearch) ||
                    order.id.includes(debouncedSearch) ||
                    order.link.includes(debouncedSearch)
                );
            }

            setOrders(newOrders);
            setFirstVisible(documentSnapshots.docs[0] || null);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] || null);
            setIsNextPageAvailable(documentSnapshots.docs.length === ITEMS_PER_PAGE);

            if (direction === 'first') setPage(1);
            else if (direction === 'next') setPage(p => p + 1);
            else if (direction === 'prev') setPage(p => p - 1);

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: "فشل في جلب الطلبات." });
        } finally {
            setIsLoading(false);
        }
    }, [firestore, currentStatus, debouncedSearch, lastVisible, firstVisible, toast]);

    useEffect(() => {
        fetchOrders('first');
    }, [currentStatus, debouncedSearch]); // Refetch on filter change

    const handleFilterChange = (key: 'search' | 'status', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'all') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.replace(`${pathname}?${params.toString()}`);
    };


    const renderContent = () => {
         if (isLoading) {
            return Array.from({length: 10}).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({length: 7}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
            ));
        }

        if (!orders || orders.length === 0) {
            return (
                 <TableRow>
                    <TableCell colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="mx-auto bg-muted p-4 rounded-full"><ListFilter className="h-12 w-12 text-muted-foreground" /></div>
                            <h3 className="mt-4 font-headline text-2xl">لا توجد طلبات تطابق بحثك</h3>
                            <p className="mt-2 text-sm text-muted-foreground">حاول تغيير فلاتر البحث أو التأكد من وجود طلبات.</p>
                             <Button variant="outline" onClick={() => handleFilterChange('search', '')} className="mt-4">
                                إعادة تعيين الفلاتر
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }

        return orders.map((order) => (
            <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.substring(0,8)}...</TableCell>
                <TableCell className="font-mono text-xs">{order.userId.substring(0,8)}...</TableCell>
                <TableCell className="font-medium">{order.serviceName}</TableCell>
                <TableCell><a href={order.link} className="text-primary hover:underline" target="_blank">{order.link}</a></TableCell>
                <TableCell>
                    <Badge variant={statusVariant[order.status as keyof typeof statusVariant] || 'default'}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">${order.charge.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                    <OrderActions order={order} onOrderUpdate={() => fetchOrders('first')} />
                </TableCell>
            </TableRow>
        ));
    };

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
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
                <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="ابحث بالمعرف، المستخدم، أو الرابط..."
                    value={currentSearch}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pe-10 rtl:ps-10"
                />
            </div>
            <Select value={currentStatus} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger><SelectValue placeholder="فلترة حسب الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4">
             <span className="text-sm text-muted-foreground">
                صفحة {page}
            </span>
            <div className="flex gap-2">
                 <Button onClick={() => fetchOrders('prev')} disabled={isLoading || page <= 1} variant="outline">
                    <ChevronRight className="h-4 w-4 me-2 rtl:hidden" />
                     <ChevronLeft className="h-4 w-4 ms-2 ltr:hidden" />
                    السابق
                </Button>
                <Button onClick={() => fetchOrders('next')} disabled={isLoading || !isNextPageAvailable} variant="outline">
                    التالي
                    <ChevronLeft className="h-4 w-4 ms-2 rtl:hidden" />
                    <ChevronRight className="h-4 w-4 me-2 ltr:hidden" />
                </Button>
            </div>
        </CardFooter>
      </Card>
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
