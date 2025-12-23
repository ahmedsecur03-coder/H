
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, getDocs } from 'firebase/firestore';
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
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

export default function AdminSupportPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    if (!firestore) return;

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const ticketsQuery = query(collectionGroup(firestore, 'tickets'), orderBy('createdDate', 'desc'));
            const querySnapshot = await getDocs(ticketsQuery);
            const fetchedTickets: Ticket[] = [];
            querySnapshot.forEach(doc => {
                // Important: we need to manually add the userId which is not part of the ticket document data itself
                // The path is users/{userId}/tickets/{ticketId}
                const pathSegments = doc.ref.path.split('/');
                const userId = pathSegments[1];
                fetchedTickets.push({ id: doc.id, userId: userId, ...doc.data() } as Ticket);
            });
            setTickets(fetchedTickets);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب تذاكر الدعم.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchTickets();
  }, [firestore, toast]);
  
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
        <TableCell className="font-mono text-xs">{ticket.userId}</TableCell>
        <TableCell>
          <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
        </TableCell>
        <TableCell>{new Date(ticket.createdDate).toLocaleDateString('ar-EG')}</TableCell>
          <TableCell className="text-right">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/support/${ticket.id}?userId=${ticket.userId}`}>
              عرض و رد
            </Link>
          </Button>
        </TableCell>
      </TableRow>
    ));
  }


  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الدعم الفني</h1>
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
