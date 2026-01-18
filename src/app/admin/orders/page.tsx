
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, orderBy, where, getDocs, limit, startAfter, DocumentData, deleteDoc, doc, Query } from 'firebase/firestore';
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
import { Search, ListFilter, Trash2 } from 'lucide-react';
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
import { PLATFORM_ICONS } from '@/lib/icon-data';
import { useServices } from '@/hooks/useServices';

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
                                {Array.from({ length: 15 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
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
  const { services } = useServices();

  const currentStatus = searchParams.get('status') || 'all';
  const currentSearch = searchParams.get('search') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        let q: Query = collectionGroup(firestore, 'orders');
        
        if (currentStatus !== 'all') {
            q = query(q, where('status', '==', currentStatus));
        }

        if (currentSearch) {
          q = query(q, where('userId', '==', currentSearch)); 
        }
        
        const snapshot = await getDocs(q);

        const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            userId: doc.ref.parent.parent!.id,
            ...doc.data()
        } as Order));
        
        // Sort client-side to avoid index errors
        ordersData.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

        setOrders(ordersData);

    } catch(error: any) {
        console.error("Failed to fetch orders:", error);
        toast({ variant: 'destructive', title: "خطأ في الاستعلام", description: 'لا يمكن جلب الطلبات. قد يتطلب هذا البحث إنشاء فهرس مركب في Firestore.'})
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast, currentStatus, currentSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  

  const handleDelete = async (order: Order) => {
    if (!firestore) return;
    const orderDocRef = doc(firestore, `users/${order.userId}/orders`, order.id);
    try {
        await deleteDoc(orderDocRef);
        toast({ title: 'نجاح', description: 'تم حذف الطلب بنجاح.' });
        fetchOrders();
    } catch (error) {
         const permissionError = new FirestorePermissionError({
            path: orderDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }

  const handleFilterChange = (key: 'search' | 'status', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Remove pagination when filters change
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
           <a href={order.link} className="text-primary hover:underline truncate block max-w-[150px]" target="_blank" rel="noopener noreferrer">{order.link}</a>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <OrderActions order={order} onOrderUpdate={() => fetchOrders()} />
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

  if (isLoading) {
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
                placeholder="ابحث بمعرف المستخدم..."
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

      {orders.length > 0 ? (
        <>
            {/* Mobile View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:hidden gap-4">
                {orders.map(order => <OrderCard key={order.id} order={order} />)}
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
                        {orders.map((order) => {
                            const service = services?.find(s => s.id === order.serviceId);
                            const Icon = service ? PLATFORM_ICONS[service.platform] : PLATFORM_ICONS.Default;
                            return (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">{order.id.substring(0,8)}...</TableCell>
                                    <TableCell>
                                    <Link href={`/admin/users?search=${order.userId}`} className="font-mono text-xs text-primary hover:underline">{order.userId.substring(0,8)}...</Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            <Icon className="w-4 h-4 text-muted-foreground"/>
                                            <span>{order.serviceName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell><a href={order.link} className="text-primary hover:underline truncate block max-w-xs" target="_blank" rel="noopener noreferrer">{order.link}</a></TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[order.status as keyof typeof statusVariant] || 'default'}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">${order.charge.toFixed(2)}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end gap-2">
                                        <OrderActions order={order} onOrderUpdate={() => fetchOrders()} />
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
                            )
                        })}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
            </Card>
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
