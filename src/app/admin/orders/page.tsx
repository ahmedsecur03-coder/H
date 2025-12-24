'use client';

import { useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collectionGroup, query, orderBy, where, Query as FirestoreQuery, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData } from 'firebase/firestore';
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
import { Search, ListFilter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { OrderActions } from './_components/order-actions';
import { useToast } from '@/hooks/use-toast';

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

const ITEMS_PER_PAGE = 10;

function OrdersPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-8 w-1/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-0">
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
                </CardContent>
                 <CardFooter className="justify-center border-t pt-4">
                    <Skeleton className="h-9 w-64" />
                 </CardFooter>
            </Card>
        </div>
    );
}

function AdminOrdersPageComponent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentStatus = searchParams.get('status') || 'all';
  const currentSearch = searchParams.get('search') || '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [firstDoc, setFirstDoc] = useState<any | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        let q: FirestoreQuery = collectionGroup(firestore, 'orders');
        
        // Firestore doesn't support complex text search + inequality filters well.
        // We will filter by status in the query, and search will be a simplified client-side filter
        // on the fetched page data. This is a compromise for performance. A better solution
        // would involve a dedicated search service like Algolia.
        if (currentStatus !== 'all') {
            q = query(q, where('status', '==', currentStatus));
        }

        // We apply ordering after status filter
        q = query(q, orderBy('orderDate', 'desc'));
        
        // Pagination logic would be more complex with cursors and changing queries.
        // For simplicity and given the constraints, we'll fetch a slightly larger set and paginate client-side for now.
        // A production-ready solution would store pagination cursors.
        const snapshot = await getDocs(q);
        let ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));

        // Client-side search on the (potentially status-filtered) results
        if(currentSearch) {
            ordersData = ordersData.filter(order => 
                order.id.toLowerCase().includes(currentSearch.toLowerCase()) ||
                order.userId.toLowerCase().includes(currentSearch.toLowerCase()) ||
                order.serviceName.toLowerCase().includes(currentSearch.toLowerCase()) ||
                (order.link && order.link.toLowerCase().includes(currentSearch.toLowerCase()))
            );
        }
        
        const totalPages = Math.ceil(ordersData.length / ITEMS_PER_PAGE);
        setPageCount(totalPages);

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        setOrders(ordersData.slice(startIndex, startIndex + ITEMS_PER_PAGE));

    } catch(error) {
        console.error("Failed to fetch orders:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch orders.'})
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast, currentStatus, currentSearch, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  const handleFilterChange = (key: 'search' | 'status' | 'page', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') {
      params.set('page', '1');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const renderPaginationItems = () => {
    if (pageCount <= 1) return null;
    
    const pageNumbers: (number | 'ellipsis')[] = [];
    const visiblePages = 1; 

    if (pageCount <= 5) {
      for (let i = 1; i <= pageCount; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (currentPage > visiblePages + 2) {
        pageNumbers.push('ellipsis');
      }

      let start = Math.max(2, currentPage - visiblePages);
      let end = Math.min(pageCount - 1, currentPage + visiblePages);
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < pageCount - (visiblePages + 1)) {
        pageNumbers.push('ellipsis');
      }
      pageNumbers.push(pageCount);
    }

    return pageNumbers.map((page, index) => (
      <PaginationItem key={`${page}-${index}`}>
        {page === 'ellipsis' ? (
          <PaginationEllipsis />
        ) : (
          <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); handleFilterChange('page', String(page)); }}>
            {page}
          </PaginationLink>
        )}
      </PaginationItem>
    ));
  };
  
  if (isLoading && orders.length === 0) {
    return <OrdersPageSkeleton />;
  }

  const OrderCard = ({ order }: { order: Order }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium truncate">{order.serviceName}</CardTitle>
        <CardDescription className="font-mono text-xs">{order.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">الحالة</span>
          <Badge variant={statusVariant[order.status as keyof typeof statusVariant] || 'default'}>{order.status}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">المستخدم</span>
          <span className="font-mono text-xs">{order.userId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">التكلفة</span>
          <span className="font-semibold">${order.charge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">الرابط</span>
           <a href={order.link} className="text-primary hover:underline truncate block max-w-[150px]" target="_blank">{order.link}</a>
        </div>
      </CardContent>
      <CardFooter>
        <OrderActions order={order} onOrderUpdate={fetchOrders} />
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الطلبات</h1>
        <p className="text-muted-foreground">
          عرض وتعديل جميع طلبات SMM في النظام.
        </p>
      </div>

       <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالمعرف، المستخدم، أو الرابط..."
                className="pe-10 rtl:ps-10"
                value={currentSearch}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <Select value={currentStatus} onValueChange={(value) => handleFilterChange('status', value)}>
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
        </CardContent>
      </Card>

      {isLoading && orders.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : orders.length > 0 ? (
        <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
                {orders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>

            {/* Desktop View */}
            <Card className="hidden md:block">
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
                    {orders.map((order) => (
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
                            <OrderActions order={order} onOrderUpdate={fetchOrders} />
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
            {pageCount > 1 && (
                <Pagination>
                    <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handleFilterChange('page', String(currentPage - 1)); }} disabled={currentPage === 1}/>
                    </PaginationItem>
                    
                    {renderPaginationItems()}

                    <PaginationItem>
                        <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handleFilterChange('page', String(currentPage + 1)); }} disabled={currentPage === pageCount} />
                    </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
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
