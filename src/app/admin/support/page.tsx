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

const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

const dummyTickets = [
    {
        id: 'ticket_1',
        user: 'أحمد المصري',
        subject: 'تأخر في تنفيذ طلب',
        status: 'مفتوحة',
        createdDate: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: 'ticket_2',
        user: 'سارة خالد',
        subject: 'مشكلة في الإيداع',
        status: 'قيد المراجعة',
        createdDate: new Date().toISOString(),
    },
    {
        id: 'ticket_3',
        user: 'محمد علي',
        subject: 'استفسار عن خدمة',
        status: 'مغلقة',
        createdDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    }
]

export default function AdminSupportPage() {
  const tickets = dummyTickets;
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الدعم الفني</h1>
        <p className="text-muted-foreground">عرض والرد على تذاكر الدعم من المستخدمين.</p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>جميع تذاكر الدعم</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموضوع</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell>{ticket.user}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(ticket.createdDate).toLocaleDateString()}</TableCell>
                   <TableCell className="text-right">
                    <Button variant="outline" size="sm">عرض و رد</Button>
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
