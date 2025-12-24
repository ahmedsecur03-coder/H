
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, where, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData, Query } from 'firebase/firestore';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from 'use-debounce';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';


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

    const currentPage = Number(searchParams.get('page')) || 1;
    const currentStatus = searchParams.get('status') || 'all';
    const currentSearch = searchParams.get('search') || '';

    const [debouncedSearch] = useDebounce(currentSearch, 500);

    const ordersQuery = useMemoFirebase(
        () => (firestore ? query(collectionGroup(firestore, 'orders'), orderBy('orderDate', 'desc')) : null),
        [firestore]
    );

    const { data: allOrders, isLoading, forceCollectionUpdate } = useCollection<Order>(ordersQuery);

    const { paginatedOrders, pageCount } = useMemo(() => {
        if (!allOrders) return { paginatedOrders: [], pageCount: 0 };
        
        const filtered = allOrders.filter(order => {
            const statusMatch = currentStatus === 'all' || order.status === currentStatus;
            const searchMatch = debouncedSearch ?
                order.userId.includes(debouncedSearch) ||
                order.id.includes(debouncedSearch) ||
                order.link.includes(debouncedSearch)
                : true;
            return statusMatch && searchMatch;
        });

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return {
            paginatedOrders: filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE),
            pageCount: totalPages,
        };
    }, [allOrders, currentStatus, debouncedSearch, currentPage]);

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
        if (pageCount <= 7) {
            for (let i = 1; i <= pageCount; i++) pageNumbers.push(i);
        } else {
            pageNumbers.push(1);
            if (currentPage > 3) pageNumbers.push('ellipsis');
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(pageCount - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pageNumbers.push(i);
            if (currentPage < pageCount - 2) pageNumbers.push('ellipsis');
            pageNumbers.push(pageCount);
        }
        return pageNumbers.map((page, index) => (
            <PaginationItem key={`${page}-${index}`}>
                {page === 'ellipsis' ? <PaginationEllipsis /> : (
                    <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); handleFilterChange('page', String(page)); }}>{page}</PaginationLink>
                )}
            </PaginationItem>
        ));
    };

    const renderContent = () => {
         if (isLoading && !allOrders) {
            return Array.from({length: 10}).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({length: 7}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
            ));
        }

        if (!paginatedOrders || paginatedOrders.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">لا توجد طلبات تطابق بحثك.</TableCell>
                </TableRow>
            );
        }

        return paginatedOrders.map((order) => (
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
                    <OrderActions order={order} onOrderUpdate={forceCollectionUpdate} />
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
            <Input 
                placeholder="ابحث بالمعرف، المستخدم، أو الرابط..."
                value={currentSearch}
                onChange={(e) => handleFilterChange('search', e.target.value)}
            />
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
        {pageCount > 1 && (
            <CardFooter className="flex items-center justify-center border-t pt-4">
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
