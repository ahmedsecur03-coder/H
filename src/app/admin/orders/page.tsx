'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

const statusVariant = {
  مكتمل: 'default',
  'قيد التنفيذ': 'secondary',
  ملغي: 'destructive',
  جزئي: 'outline',
} as const;

export default function AdminOrdersPage() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const ordersQuery = useMemoFirebase(
        () => (firestore ? query(collectionGroup(firestore, 'orders')) : null),
        [firestore]
    );

    const { data: allOrders, isLoading } = useCollection<Order>(ordersQuery);

    const filteredOrders = useMemo(() => {
        if (!allOrders) return [];
        
        return allOrders.filter(order => {
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            const lowerCaseSearch = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                order.id.toLowerCase().includes(lowerCaseSearch) ||
                order.userId.toLowerCase().includes(lowerCaseSearch) ||
                order.link.toLowerCase().includes(lowerCaseSearch);

            return matchesStatus && matchesSearch;
        });

    }, [allOrders, statusFilter, searchTerm]);

    const renderContent = () => {
         if (isLoading && !filteredOrders) {
            return Array.from({length: 10}).map((_, i) => (
                <TableRow key={i}>
                    {Array.from({length: 6}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
            ));
        }

        if (filteredOrders.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">لا توجد طلبات تطابق بحثك.</TableCell>
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
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
                placeholder="ابحث بالمعرف، المستخدم، أو الرابط..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
