
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Ticket } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

function NewTicketDialog({ userId, onTicketCreated }: { userId: string, onTicketCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message || !firestore) return;

    setIsSubmitting(true);
    
    const newTicket: Omit<Ticket, 'id'> = {
      userId,
      subject,
      message, // The initial message from the user
      status: 'مفتوحة',
      createdDate: new Date().toISOString(),
      messages: [{
        sender: 'user',
        text: message,
        timestamp: new Date().toISOString(),
      }],
    };

    const ticketsColRef = collection(firestore, `users/${userId}/tickets`);
    addDoc(ticketsColRef, newTicket)
        .then(docRef => {
            toast({
                title: 'تم فتح التذكرة بنجاح',
                description: 'سيقوم فريق الدعم بالرد عليك في أقرب وقت ممكن.',
            });
            setSubject('');
            setMessage('');
            setOpen(false);
            onTicketCreated(docRef.id);
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: ticketsColRef.path,
                operation: 'create',
                requestResourceData: newTicket
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="ml-2 h-4 w-4" />
          فتح تذكرة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تذكرة دعم جديدة</DialogTitle>
          <DialogDescription>
            صف مشكلتك بالتفصيل وسيقوم فريقنا بالرد عليك.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              الموضوع
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right">
              الرسالة
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'إرسال التذكرة'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SupportPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const ticketsQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(collection(firestore, `users/${user.uid}/tickets`), orderBy('createdDate', 'desc'))
        : null,
    [user, firestore]
  );

  const { data: tickets, isLoading } = useCollection<Ticket>(ticketsQuery);

  const handleTicketCreated = (ticketId: string) => {
    router.push(`/dashboard/support/${ticketId}`);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">الدعم الفني</h1>
          <p className="text-muted-foreground">
            تواصل مع فريق الدعم لدينا. نحن هنا لمساعدتك.
          </p>
        </div>
        {user && <NewTicketDialog userId={user.uid} onTicketCreated={handleTicketCreated} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تذاكر الدعم الخاصة بك</CardTitle>
          <CardDescription>هنا يمكنك متابعة جميع تذاكر الدعم التي قمت بفتحها.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
          ) : tickets && tickets.length > 0 ? (
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
                <h3 className="mt-4 text-lg font-medium">لا توجد تذاكر دعم</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    يمكنك فتح تذكرة جديدة للحصول على المساعدة.
                </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
