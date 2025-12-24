'use client';

import { useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, where, Query as FirestoreQuery, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData } from 'firebase/firestore';
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
import { Search, ListFilter } from 'lucide-react';
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
import { useDebounce } from 'use-debounce';

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

function OrdersPageComponent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state
  const currentPage = Number(searchParams.get('page')) || 1;
  const currentStatus = searchParams.get('status') || 'all';
  const currentSearch = searchParams.get('search') || '';
  
  // Debounced search term for performance
  const [debouncedSearch] = useDebounce(currentSearch, 300);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data once
  const fetchOrders = useCallback(async () => {
    if (!user || !firestore) return;
    setIsLoading(true);
    const ordersQuery = query(collection(firestore, `users/${user.uid}/orders`), orderBy('orderDate', 'desc'));
    const snapshot = await getDocs(ordersQuery);
    const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    setOrders(ordersData);
    setIsLoading(false);
  }, [user, firestore]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  // Memoized client-side filtering
  const { paginatedOrders, pageCount } = useMemo(() => {
    if (!orders) {
      return { paginatedOrders: [], pageCount: 0 };
    }

    const filtered = orders.filter(order => {
      const statusMatch = currentStatus === 'all' || order.status === currentStatus;
      const searchMatch = debouncedSearch
        ? order.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          order.serviceName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (order.link && order.link.toLowerCase().includes(debouncedSearch.toLowerCase()))
        : true;
      return statusMatch && searchMatch;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    
    return {
      paginatedOrders: filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE),
      pageCount: totalPages,
    };
  }, [orders, currentStatus, debouncedSearch, currentPage]);

  const handleFilterChange = (key: 'search' | 'status' | 'page', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Always reset page to 1 when search or status filters change
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
  
  if (isLoading) {
    return <OrdersPageSkeleton />;
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">سجل الطلبات</h1>
        <p className="text-muted-foreground">
          عرض جميع طلباتك السابقة وتتبع حالة الطلبات الحالية.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالمعرف، الخدمة أو الرابط..."
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

      {paginatedOrders.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">المعرف</TableHead>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>الرابط</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">التاريخ</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{order.serviceName}</TableCell>
                    <TableCell><a href={order.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-xs">{order.link}</a></TableCell>
                    <TableCell className="text-center">{order.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusVariant[order.status] || 'default'}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{new Date(order.orderDate).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell className="text-right">${order.charge.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           {pageCount > 1 && (
             <CardFooter className="justify-center border-t pt-4">
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
            </CardFooter>
           )}
        </Card>
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
                    حاول تغيير فلاتر البحث أو قم بإنشاء طلب جديد.
                </p>
                <Button variant="outline" onClick={() => router.push(pathname)} className="mt-4">
                  إعادة تعيين الفلاتر
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <OrdersPageComponent />
    </Suspense>
  )
}
