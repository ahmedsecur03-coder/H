
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, where, Query } from 'firebase/firestore';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ListFilter } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

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

export default function OrdersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const baseQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `users/${user.uid}/orders`) : null),
    [firestore, user]
  );
  
  const ordersQuery = useMemoFirebase(() => {
    if (!baseQuery) return null;
    let q: Query = query(baseQuery, orderBy('orderDate', 'desc'));
    if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter));
    }
    // Note: Firestore doesn't support full-text search natively on multiple fields.
    // The search term filter will be applied on the client-side for simplicity here.
    return q;
  }, [baseQuery, statusFilter]);

  const { data: allOrders, isLoading } = useCollection<Order>(ordersQuery);

  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];
    if (!searchTerm) return allOrders;
    return allOrders.filter(order => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.link.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allOrders, searchTerm]);

  const totalPages = useMemo(() => {
    if (!filteredOrders) return 0;
    return Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  }, [filteredOrders]);


  const paginatedOrders = useMemo(() => {
    if (!filteredOrders) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (isLoading && !allOrders) {
    return <OrdersPageSkeleton />;
  }

  const renderPaginationItems = () => {
    if (totalPages <= 1) return null;
    
    const items = [];
    const pageNumbers: number[] = [];

    // Always show first page
    pageNumbers.push(1);

    // Logic for ellipsis and nearby pages
    if (currentPage > 3) {
      pageNumbers.push(-1); // Ellipsis
    }
    if (currentPage > 2) {
      pageNumbers.push(currentPage - 1);
    }
    if (currentPage !== 1 && currentPage !== totalPages) {
      pageNumbers.push(currentPage);
    }
    if (currentPage < totalPages - 1) {
      pageNumbers.push(currentPage + 1);
    }
    if (currentPage < totalPages - 2) {
      pageNumbers.push(-1); // Ellipsis
    }
    
    // Always show last page
    if (totalPages > 1) {
        pageNumbers.push(totalPages);
    }

    const uniquePageNumbers = [...new Set(pageNumbers)];

    uniquePageNumbers.forEach((page, index) => {
        if (page === -1) {
            items.push(<PaginationEllipsis key={`ellipsis-${index}`} />);
        } else {
            items.push(
                <PaginationItem key={page}>
                    <PaginationLink href="#" isActive={currentPage === page} onClick={(e) => { e.preventDefault(); handlePageChange(page); }}>{page}</PaginationLink>
                </PaginationItem>
            );
        }
    });

    return items;
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الطلبات</h1>
        <p className="text-muted-foreground">
          استعرض، ابحث، وفلتر جميع طلباتك السابقة والحالية.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالمعرف، الخدمة، أو الرابط..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      {isLoading && (!paginatedOrders || paginatedOrders.length === 0) ? (
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
      ) : paginatedOrders && paginatedOrders.length > 0 ? (
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
           {totalPages > 1 && (
             <CardFooter className="justify-center border-t pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} disabled={currentPage === 1}/>
                    </PaginationItem>
                    
                    {renderPaginationItems()}

                    <PaginationItem>
                      <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} disabled={currentPage === totalPages} />
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
                    حاول تغيير كلمات البحث أو إزالة الفلاتر لعرض المزيد من النتائج.
                </p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
