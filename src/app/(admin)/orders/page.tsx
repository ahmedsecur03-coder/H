'use client';

import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusVariant = {
  مكتمل: 'default',
  'قيد التنفيذ': 'secondary',
  ملغي: 'destructive',
  جزئي: 'outline',
} as const;

const dummyOrders = [
    {
        id: 'ord_1',
        user: 'أحمد المصري',
        serviceName: 'متابعين انستغرام',
        link: 'https://instagram.com/ahmed',
        quantity: 5000,
        charge: 5.50,
        orderDate: new Date().toISOString(),
        status: 'قيد التنفيذ',
    },
    {
        id: 'ord_2',
        user: 'سارة خالد',
        serviceName: 'مشاهدات تيك توك',
        link: 'https://tiktok.com/@sara/video/123',
        quantity: 100000,
        charge: 1.20,
        orderDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'مكتمل',
    },
];

export default function AdminOrdersPage() {
    const orders = dummyOrders;

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
            <Input placeholder="ابحث بالمعرف، المستخدم، أو الرابط..." />
            <Select>
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
              {orders.map((order) => (
                <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell>{order.user}</TableCell>
                    <TableCell className="font-medium">{order.serviceName}</TableCell>
                    <TableCell><a href={order.link} className="text-primary hover:underline" target="_blank">{order.link}</a></TableCell>
                    <TableCell>
                        <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">${order.charge.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
