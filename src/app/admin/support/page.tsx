
'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useFirestore } from '@/firebase';
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
import { useSearchParams } from 'next/navigation';

const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

type Status = keyof typeof statusVariant;


function TicketsTable({ tickets, isLoading }: { tickets: Ticket[], isLoading: boolean }) {
   
    if (isLoading) {
        return (
            <div className="overflow-x-auto">
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
            </div>
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
        <div className="overflow-x-auto">
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
        </div>
    );
};

function AdminSupportPageComponent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userIdFilter = searchParams.get('userId');

  const fetchTickets = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
        let ticketsQuery = query(collectionGroup(firestore, 'tickets'));

        if(userIdFilter) {
             ticketsQuery = query(ticketsQuery, where('userId', '==', userIdFilter));
        }

        if (activeTab === 'open') {
             ticketsQuery = query(ticketsQuery, where('status', 'in', ['مفتوحة', 'قيد المراجعة']));
        } else {
             ticketsQuery = query(ticketsQuery, where('status', '==', 'مغلقة'));
        }
        
        ticketsQuery = query(ticketsQuery, orderBy('createdDate', 'desc'));

        const snapshot = await getDocs(ticketsQuery);
        const fetchedTickets: Ticket[] = [];
        snapshot.forEach(doc => {
            const pathSegments = doc.ref.path.split('/');
            const userId = pathSegments[1];
            fetchedTickets.push({ id: doc.id, userId: userId, ...doc.data() } as Ticket);
        });
        setTickets(fetchedTickets);
    } catch(finalError) {
        console.error("Error fetching tickets:", finalError);
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في جلب تذاكر الدعم. قد تحتاج لإنشاء فهرس في Firestore.' });
    } finally {
        setIsLoading(false);
    }
  }, [firestore, toast, activeTab, userIdFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة الدعم الفني</h1>
        <p className="text-muted-foreground">
            {userIdFilter 
                ? `عرض تذاكر الدعم للمستخدم: ${userIdFilter}`
                : "عرض والرد على تذاكر الدعم من المستخدمين."
            }
        </p>
      </div>

       <Tabs defaultValue="open" className="w-full" onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="open">التذاكر النشطة</TabsTrigger>
                <TabsTrigger value="closed">التذاكر المغلقة</TabsTrigger>
            </TabsList>
            <Card className="mt-4">
                <CardContent className="p-0">
                    <TicketsTable tickets={tickets} isLoading={isLoading} />
                </CardContent>
            </Card>
        </Tabs>
    </div>
  );
}


export default function AdminSupportPage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <AdminSupportPageComponent />
        </Suspense>
    )
}
