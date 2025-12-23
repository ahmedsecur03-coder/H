'use client';

import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { Ticket } from '@/lib/types';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { TicketChat } from './_components/ticket-chat';
import { Skeleton } from '@/components/ui/skeleton';


const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;


function TicketDetailsSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <Skeleton className="h-8 w-36" />
             <Card className="flex flex-col h-[calc(100vh-14rem)]">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-48 mt-2" />
                        </div>
                        <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                    <div className="flex justify-end"><Skeleton className="h-16 w-1/2 rounded-lg" /></div>
                    <div className="flex justify-start"><Skeleton className="h-20 w-2/3 rounded-lg" /></div>
                </CardContent>
                 <CardFooter className="pt-4 border-t">
                    <Skeleton className="h-20 w-full" />
                 </CardFooter>
            </Card>
        </div>
    );
}

export default function TicketDetailsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const ticketId = params.ticketId as string;

  const ticketDocRef = useMemoFirebase(
      () => (firestore && user ? doc(firestore, `users/${user.uid}/tickets`, ticketId) : null),
      [firestore, user, ticketId]
  );
  const { data: ticket, isLoading: isTicketLoading } = useDoc<Ticket>(ticketDocRef);
  
  const isLoading = isUserLoading || isTicketLoading;

  if (isLoading) {
    return <TicketDetailsSkeleton />;
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">التذكرة غير موجودة</h2>
        <p className="text-muted-foreground">لم نتمكن من العثور على تذكرة الدعم المطلوبة.</p>
        <Button asChild className="mt-4">
            <Link href="/dashboard/support">العودة إلى الدعم</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/support">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى كل التذاكر
          </Link>
        </Button>

        <Card className="flex flex-col h-[calc(100vh-14rem)]">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="font-headline text-2xl">{ticket.subject}</CardTitle>
                        <CardDescription>
                            تاريخ الإنشاء: {new Date(ticket.createdDate).toLocaleString('ar-EG')}
                        </CardDescription>
                    </div>
                    <Badge variant={statusVariant[ticket.status] || 'default'} className="text-base px-4 py-1">{ticket.status}</Badge>
                </div>
            </CardHeader>
            <TicketChat ticket={ticket} />
        </Card>
    </div>
  );
}
