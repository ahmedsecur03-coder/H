
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MessageSquare, Loader2 } from 'lucide-react';
import type { Ticket } from '@/lib/types';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { NewTicketDialog } from './_components/new-ticket-dialog';
import { Skeleton } from '@/components/ui/skeleton';


const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;


function SupportPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div className="flex justify-between items-center">
                 <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64 mt-2" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SupportPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const ticketsQuery = useMemoFirebase(
        () => (firestore && user ? query(collection(firestore, `users/${user.uid}/tickets`), orderBy('createdDate', 'desc')) : null),
        [firestore, user]
    );

    const { data: tickets, isLoading: isTicketsLoading } = useCollection<Ticket>(ticketsQuery);

    const isLoading = isUserLoading || isTicketsLoading;

    if (isLoading) {
        return <SupportPageSkeleton />;
    }


  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">الدعم الفني</h1>
          <p className="text-muted-foreground">
            تواصل مع فريق الدعم لدينا. نحن هنا لمساعدتك.
          </p>
        </div>
        <NewTicketDialog>
            <Button>
              <PlusCircle className="ml-2 h-4 w-4" />
              فتح تذكرة جديدة
            </Button>
        </NewTicketDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تذاكر الدعم الخاصة بك</CardTitle>
          <CardDescription>هنا يمكنك متابعة جميع تذاكر الدعم التي قمت بفتحها.</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`} className="block">
                  <Card className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <MessageSquare className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          آخر تحديث: {new Date(ticket.messages[ticket.messages.length - 1].timestamp).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant[ticket.status] || 'default'}>
                      {ticket.status}
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-10">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-medium">ليس لديك تذاكر دعم</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    يمكنك فتح تذكرة جديدة للحصول على المساعدة.
                </p>
                 <NewTicketDialog>
                    <Button className="mt-4">
                        <PlusCircle className="ml-2 h-4 w-4" />
                        فتح تذكرة جديدة
                    </Button>
                 </NewTicketDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

