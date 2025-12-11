
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Ticket } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

function ChatMessage({ message, sender }: { message: string, sender: 'user' | 'admin' }) {
    const isUser = sender === 'user';
    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
             {!isUser && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">دعم</div>}
            <div className={`max-w-md p-3 rounded-lg ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm whitespace-pre-wrap">{message}</p>
            </div>
             {isUser && <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">أنت</div>}
        </div>
    );
}

export default function TicketDetailsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const ticketId = params.ticketId as string;
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketDocRef = useMemoFirebase(
    () => (firestore && user && ticketId ? doc(firestore, `users/${user.uid}/tickets`, ticketId) : null),
    [firestore, user, ticketId]
  );
  
  const { data: ticket, isLoading } = useDoc<Ticket>(ticketDocRef);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [ticket?.messages]);


  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !ticketDocRef || !ticket) return;

    setIsSubmitting(true);
    const newMessage = {
      sender: 'user' as const,
      text: replyMessage,
      timestamp: new Date().toISOString(),
    };

    const updatedData = {
        messages: arrayUnion(newMessage),
        status: 'قيد المراجعة',
    };

    updateDoc(ticketDocRef, updatedData)
        .then(() => {
            setReplyMessage('');
            toast({ title: 'تم إرسال ردك بنجاح.' });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: ticketDocRef.path,
                operation: 'update',
                requestResourceData: { status: 'قيد المراجعة' }
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  };


  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-1/4" />
        <Card className="flex flex-col h-[calc(100vh-12rem)]">
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
           <CardContent className="flex-1 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
        </Card>
      </div>
    );
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
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <CardContent className="space-y-6">
                {ticket.messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg.text} sender={msg.sender} />
                ))}
            </CardContent>
        </ScrollArea>
        {ticket.status !== 'مغلقة' && (
            <CardFooter className="pt-4 border-t">
                <form onSubmit={handleReply} className="w-full flex items-start gap-2">
                    <Textarea
                        placeholder="اكتب ردك هنا..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        required
                        className="flex-1"
                        rows={1}
                    />
                    <Button type="submit" size="icon" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                        <span className="sr-only">إرسال</span>
                    </Button>
                </form>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}

