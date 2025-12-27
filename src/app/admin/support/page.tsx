
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, getDocs, where } from 'firebase/firestore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

type Status = keyof typeof statusVariant;


function TicketsTable({ tickets, isLoading }: { tickets: Ticket[], isLoading: boolean }) {
   
    if (isLoading) {
        return (
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
                     {Array.from({length: 5}).map((_, i) => (
                        <TableRow key={i}>
                            {Array.from({length: 5}).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    if (!tickets || tickets.length === 0) {
        return (
            <div className="h-24 text-center flex items-center justify-center text-muted-foreground">
                لا توجد تذاكر دعم في هذا القسم.
            </div>
        );
    }
    
    return (
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
                        <TableCell>
                            <Link href={`/admin/users?search=${ticket.userId}`} className="font-mono text-xs text-primary hover:underline">{ticket.userId}</Link>
                        </TableCell>
                        <TableCell>
                        <Badge variant={statusVariant[ticket.status] || 'default'}>{ticket.status}</Badge>
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
                ))}
            </TableBody>
        </Table>
    );
};

export default function AdminSupportPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;
    setIsLoading(true);
    const ticketsQuery = query(collectionGroup(firestore, 'tickets'), orderBy('createdDate', 'desc'));
    getDocs(ticketsQuery).then(snapshot => {
        const fetchedTickets: Ticket[] = [];
        snapshot.forEach(doc => {
            const pathSegments = doc.ref.path.split('/');
            const userId = pathSegments[1];
            fetchedTickets.push({ id: doc.id, userId: userId, ...doc.data() } as Ticket);
        });
        setAllTickets(fetchedTickets);
    }).catch(error => {
        console.error("Error fetching tickets:", error);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب تذاكر الدعم.' });
    }).finally(() => {
        setIsLoading(false);
    });
  }, [firestore, toast]);
  
  const activeTickets = allTickets.filter(t => t.status !== 'مغلقة');
  const closedTickets = allTickets.filter(t => t.status === 'مغلقة');


  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الدعم الفني</h1>
        <p className="text-muted-foreground">عرض والرد على تذاكر الدعم من المستخدمين.</p>
      </div>

       <Tabs defaultValue="open" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="open">التذاكر النشطة</TabsTrigger>
                <TabsTrigger value="closed">التذاكر المغلقة</TabsTrigger>
            </TabsList>
            <Card className="mt-4">
                <CardContent className="p-0">
                    <TabsContent value="open" className="m-0">
                        <TicketsTable tickets={activeTickets} isLoading={isLoading} />
                    </TabsContent>
                    <TabsContent value="closed" className="m-0">
                       <TicketsTable tickets={closedTickets} isLoading={isLoading} />
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    </div>
  );
}
