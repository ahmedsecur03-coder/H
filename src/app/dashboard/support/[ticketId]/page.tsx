'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Ticket } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const statusVariant = {
  'مفتوحة': 'secondary',
  'مغلقة': 'destructive',
  'قيد المراجعة': 'default',
} as const;

function ChatMessage({ message, sender }: { message: string, sender: 'user' | 'admin' }) {
    const isUser = sender === 'user';
    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : ''}`}>
             {!isUser && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">دعم</div>}
            <div className={`max-w-md p-3 rounded-lg ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm">{message}</p>
            </div>
             {isUser && <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">أنت</div>}
        </div>
    );
}

export default function TicketDetailsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const { toast } = useToast();
  
  const ticketId = params.ticketId as string;
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketDocRef = useMemoFirebase(
    () => (firestore && user && ticketId ? doc(firestore, `users/${user.uid}/tickets`, ticketId) : null),
    [firestore, user, ticketId]
  );
  
  const { data: ticket, isLoading } = useDoc<Ticket>(ticketDocRef);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !ticketDocRef || !ticket) return;

    setIsSubmitting(true);
    const newMessage = {
      sender: 'user' as const,
      text: replyMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      await updateDoc(ticketDocRef, {
        messages: arrayUnion(newMessage),
        status: 'قيد المراجعة',
      });
      setReplyMessage('');
      toast({ title: 'تم إرسال ردك بنجاح.' });
    } catch (error) {
      console.error("Reply error:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'لم نتمكن من إرسال ردك.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-8 w-1/4" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
          <CardContent><Skeleton className="h-24 w-full" /></CardContent>
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
        <Button variant="ghost" asChild>
            <Link href="/dashboard/support">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى كل التذاكر
            </Link>
        </Button>

      <Card>
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
        <CardContent className="space-y-6">
            {ticket.messages.map((msg, index) => (
                <ChatMessage key={index} message={msg.text} sender={msg.sender} />
            ))}
        </CardContent>
        {ticket.status !== 'مغلقة' && (
            <CardContent>
                <form onSubmit={handleReply} className="flex items-start gap-2 pt-6 border-t">
                    <Textarea
                        placeholder="اكتب ردك هنا..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        required
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
                        <span className="sr-only">إرسال</span>
                    </Button>
                </form>
            </CardContent>
        )}
      </Card>
    </div>
  );
}