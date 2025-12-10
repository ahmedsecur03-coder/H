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

const dummyUsers = [
    {
        id: 'user_1',
        name: 'أحمد المصري',
        email: 'ahmed.masry@example.com',
        rank: 'قائد صاروخي',
        balance: 150.75,
        totalSpent: 620.00,
        joinDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
        id: 'user_2',
        name: 'سارة خالد',
        email: 'sara.khalid@example.com',
        rank: 'مستكشف نجمي',
        balance: 25.00,
        totalSpent: 85.50,
        joinDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
        id: 'user_3',
        name: 'محمد عبد الله',
        email: 'mohamed.abd@example.com',
        rank: 'سيد المجرة',
        balance: 1200.00,
        totalSpent: 2800.00,
        joinDate: new Date(Date.now() - 86400000 * 30).toISOString(),
    }
];

export default function AdminUsersPage() {
  // TODO: Replace with actual Firestore data fetching and state management
  const users = dummyUsers;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
        <p className="text-muted-foreground">
          عرض وتعديل بيانات المستخدمين في المنصة.
        </p>
      </div>

       <Card>
        <CardHeader>
          <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو المعرف..."
                className="pr-10"
              />
            </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>الرتبة</TableHead>
                <TableHead>الرصيد</TableHead>
                <TableHead>إجمالي الإنفاق</TableHead>
                <TableHead>تاريخ الانضمام</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{user.rank}</Badge></TableCell>
                  <TableCell className="font-medium">${user.balance.toFixed(2)}</TableCell>
                  <TableCell>${user.totalSpent.toFixed(2)}</TableCell>
                  <TableCell>{new Date(user.joinDate).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">تعديل</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
