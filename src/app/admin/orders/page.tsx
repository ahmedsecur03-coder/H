
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, where, orderBy, getDocs, limit, startAfter, endBefore, limitToLast, DocumentData, Query } from 'firebase/firestore';
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

const statusVariant = {
  مكتمل: 'default',
  'قيد التنفيذ': 'secondary',
  ملغي: 'destructive',
  جزئي: 'outline',
} as const;

const ITEMS_PER_PAGE = 25;

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
    const [firstVisible, setFirstVisible] = useState<DocumentData | null>(null);
    const [page, setPage] = useState(1);

    const fetchOrders = async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
        if (!firestore) return;
        setIsLoading(true);

        try {
            let q: Query = collectionGroup(firestore, 'orders');

            if (statusFilter !== 'all') {
                q = query(q, where('status', '==', statusFilter));
            }

            q = query(q, orderBy('orderDate', 'desc'));

            if (direction === 'next' && lastVisible) {
                q = query(q, startAfter(lastVisible));
            } else if (direction === 'prev' && firstVisible) {
                q = query(q, endBefore(firstVisible), limitToLast(ITEMS_PER_PAGE));
            }
            
            if (direction !== 'prev') {
               q = query(q, limit(ITEMS_PER_PAGE));
            }

            const documentSnapshots = await getDocs(q);

            const newOrders: Order[] = [];
            documentSnapshots.forEach(doc => {
                newOrders.push({ id: doc.id, ...doc.data() } as Order);
            });

            if (newOrders.length === 0 && direction !== 'initial') {
              toast({ title: direction === 'next' ? "هذه هي الصفحة الأخيرة." : "هذه هي الصفحة الأولى." });
              setIsLoading(false);
              return;
            }

            setOrders(newOrders);
            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
            setFirstVisible(documentSnapshots.docs[0]);
            
            if (direction === 'next') setPage(p => p + 1);
            if (direction === 'prev' && page > 1) setPage(p => p - 1);
            if (direction === 'initial') setPage(1);

        } catch (error) {
            console.error("Error fetching orders:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب الطلبات.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchOrders('initial');
    }, [firestore, statusFilter]);

    // Note: client-side filtering for search term
    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        if (!searchTerm) return orders;
        const lowerCaseSearch = searchTerm.toLowerCase();
        return orders.filter(order => 
            order.id.toLowerCase().includes(lowerCaseSearch) ||
            order.userId.toLowerCase().includes(lowerCaseSearch) ||
            (order.link && order.link.toLowerCase().includes(lowerCaseSearch))
        );
    }, [orders, searchTerm]);


    const renderContent = () => {
         if (isLoading) {
            return Array.from({length: 10}).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({length: 7}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
            ));
        }

        if (!filteredOrders || filteredOrders.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">لا توجد طلبات تطابق بحثك.</TableCell>
                </TableRow>
            );
        }

        return filteredOrders.map((order) => (
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
                    <OrderActions order={order} onOrderUpdate={() => fetchOrders('initial')} />
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
              <SelectTrigger><SelectValue placeholder="فلترة حسب الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.keys(statusVariant).map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
        <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">صفحة {page}</span>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => fetchOrders('prev')} disabled={page <= 1}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => fetchOrders('next')} disabled={orders.length < ITEMS_PER_PAGE}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
