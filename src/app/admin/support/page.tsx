
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import type { Ticket } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';


const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

export default function AdminSupportPage() {
  const firestore = useFirestore();

  const ticketsQuery = useMemoFirebase(
    () => firestore ? query(collectionGroup(firestore, 'tickets')) : null,
    [firestore]
  );

  const { data: tickets, isLoading } = useCollection<Ticket>(ticketsQuery);
  
  const renderContent = () => {
    if (isLoading) {
      return Array.from({length: 5}).map((_, i) => (
        <TableRow key={i}>
            {Array.from({length: 5}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
        </TableRow>
      ));
    }

    if (!tickets || tickets.length === 0) {
       return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            لا توجد تذاكر دعم حالياً.
          </TableCell>
        </TableRow>
      );
    }
    
    return tickets.map((ticket) => (
       <TableRow key={ticket.id}>
        <TableCell className="font-medium">{ticket.subject}</TableCell>
        <TableCell className="font-mono text-xs">{ticket.userId.substring(0, 10)}...</TableCell>
        <TableCell>
          <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
        </TableCell>
        <TableCell>{new Date(ticket.createdDate).toLocaleDateString()}</TableCell>
          <TableCell className="text-right">
          <Button variant="outline" size="sm">عرض و رد</Button>
        </TableCell>
      </TableRow>
    ));
  }


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
              {renderContent()}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
