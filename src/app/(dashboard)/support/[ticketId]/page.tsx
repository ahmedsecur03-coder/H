
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { Ticket } from '@/lib/types';
import Link from 'next/link';
import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
import { TicketChat } from './_components/ticket-chat';


const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

async function getTicket(userId: string, ticketId: string): Promise<Ticket | null> {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) return null;
    
    const ticketDocRef = doc(firestore, `users/${userId}/tickets`, ticketId);
    const ticketDoc = await getDoc(ticketDocRef);

    if (!ticketDoc.exists()) {
        return null;
    }
    return { id: ticketDoc.id, ...ticketDoc.data() } as Ticket;
}


export default async function TicketDetailsPage({ params }: { params: { ticketId: string } }) {
  const { user } = await getAuthenticatedUser();
  if (!user) return notFound();

  const ticket = await getTicket(user.uid, params.ticketId);

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
