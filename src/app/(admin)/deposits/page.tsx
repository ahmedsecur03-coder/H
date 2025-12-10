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
import { CheckCircle, XCircle } from 'lucide-react';

// Dummy data for demonstration
const dummyDeposits = [
  {
    id: 'dep_1',
    user: 'أحمد علي',
    email: 'ahmed@example.com',
    amount: 50,
    method: 'فودافون كاش',
    date: new Date().toISOString(),
    status: 'معلق',
    details: { phoneNumber: '01012345678' },
  },
  {
    id: 'dep_2',
    user: 'فاطمة محمد',
    email: 'fatima@example.com',
    amount: 100,
    method: 'Binance Pay',
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'مقبول',
    details: { transactionId: '987654321' },
  },
  {
    id: 'dep_3',
    user: 'خالد يوسف',
    email: 'khaled@example.com',
    amount: 25,
    method: 'فودافون كاش',
    date: new Date(Date.now() - 172800000).toISOString(),
    status: 'مرفوض',
    details: { phoneNumber: '01234567890' },
  },
];

export default function AdminDepositsPage() {
  // TODO: Replace with actual Firestore data fetching and state management
  const deposits = dummyDeposits;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الإيداعات</h1>
        <p className="text-muted-foreground">
          مراجعة طلبات الإيداع والموافقة عليها أو رفضها.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>طلبات الإيداع المعلقة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>التفاصيل</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deposits
                .filter((d) => d.status === 'معلق')
                .map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>
                      <div className="font-medium">{deposit.user}</div>
                      <div className="text-sm text-muted-foreground">
                        {deposit.email}
                      </div>
                    </TableCell>
                    <TableCell>${deposit.amount.toFixed(2)}</TableCell>
                    <TableCell>{deposit.method}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {deposit.method === 'فودافون كاش'
                        ? deposit.details.phoneNumber
                        : deposit.details.transactionId}
                    </TableCell>
                    <TableCell>
                      {new Date(deposit.date).toLocaleDateString('ar-EG')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600">
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
               {deposits.filter((d) => d.status === 'معلق').length === 0 && (
                 <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        لا توجد طلبات إيداع معلقة حالياً.
                    </TableCell>
                 </TableRow>
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
