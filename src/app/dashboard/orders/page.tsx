
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);

  // Filters state managed by URL
  const statusFilter = searchParams.get('status') || 'all';
  const searchTerm = searchParams.get('search') || '';
  const currentPage = Number(searchParams.get('page')) || 1;
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (!firestore || !user) return;

    const fetchPaginatedOrders = async () => {
        setIsLoading(true);
        try {
            let baseQuery: FirestoreQuery = collection(firestore, `users/${user.uid}/orders`);
            
            // Apply status filter at the query level
            if (statusFilter !== 'all') {
                baseQuery = query(baseQuery, where('status', '==', statusFilter));
            }

            const allFilteredDocsSnapshot = await getDocs(baseQuery);
            let allFilteredOrders = allFilteredDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            
            // Then apply search term filter on the client-side
            const finalFiltered = debouncedSearchTerm
                ? allFilteredOrders.filter(order =>
                    order.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    order.serviceName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                    (order.link && order.link.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                  ).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                : allFilteredOrders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

            setPageCount(Math.ceil(finalFiltered.length / ITEMS_PER_PAGE));
            
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            setOrders(finalFiltered.slice(startIndex, startIndex + ITEMS_PER_PAGE));

        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsLoading(false);
        }
    };

    fetchPaginatedOrders();
  }, [firestore, user, statusFilter, debouncedSearchTerm, currentPage]);

  const handleFilterChange = (key: 'search' | 'status' | 'page', value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Always reset page to 1 when search or status filters change
    if (key !== 'page') {
      params.set('page', '1');
    }
    router.push(`${pathname}?${params.toString()}`);
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

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">{t('ordersPage.title')}</h1>
        <p className="text-muted-foreground">
          {t('ordersPage.description')}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('ordersPage.searchPlaceholder')}
                className="pe-10 rtl:ps-10"
                defaultValue={searchTerm}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <Select defaultValue={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('ordersPage.statusFilterPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('ordersPage.allStatuses')}</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>{t(`orderStatus.${status}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && orders.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                    {Array.from({ length: 7 }).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : orders.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">{t('ordersPage.table.id')}</TableHead>
                  <TableHead>{t('ordersPage.table.service')}</TableHead>
                  <TableHead>{t('ordersPage.table.link')}</TableHead>
                  <TableHead className="text-center">{t('ordersPage.table.quantity')}</TableHead>
                  <TableHead className="text-center">{t('ordersPage.table.status')}</TableHead>
                  <TableHead className="text-center">{t('ordersPage.table.date')}</TableHead>
                  <TableHead className="text-right">{t('ordersPage.table.cost')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{order.serviceName}</TableCell>
                    <TableCell><a href={order.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-xs">{order.link}</a></TableCell>
                    <TableCell className="text-center">{order.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusVariant[order.status] || 'default'}>{t(`orderStatus.${order.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{new Date(order.orderDate).toLocaleDateString(t('locale'))}</TableCell>
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
                <CardTitle className="mt-4 font-headline text-2xl">{t('ordersPage.noMatchTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    {t('ordersPage.noMatchDescription')}
                </p>
                <Button variant="outline" onClick={() => router.push(pathname)} className="mt-4">
                  {t('ordersPage.resetFilters')}
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
