'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
type Status = keyof typeof statusVariant;

function ChatMessage({ message, sender }: { message: string, sender: 'user' | 'admin' }) {
    const isAdmin = sender === 'admin';
    return (
        <div className={`flex items-end gap-2 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
             {isAdmin && <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0">دعم</div>}
            <div className={`max-w-md p-3 rounded-lg ${isAdmin ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                <p className="text-sm whitespace-pre-wrap">{message}</p>
            </div>
             {!isAdmin && <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">مستخدم</div>}
        </div>
    );
}

export default function AdminTicketDetailsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const ticketId = params.ticketId as string;
  const userId = searchParams.get('userId');

  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const ticketDocRef = useMemoFirebase(
    () => (firestore && userId && ticketId ? doc(firestore, `users/${userId}/tickets`, ticketId) : null),
    [firestore, userId, ticketId]
  );
  
  const { data: ticket, isLoading } = useDoc<Ticket>(ticketDocRef);
  const [newStatus, setNewStatus] = useState<Status | null>(null);

  useEffect(() => {
    if(ticket) {
      setNewStatus(ticket.status);
    }
  }, [ticket]);

  useEffect(() => {
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
      sender: 'admin' as const,
      text: replyMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      const updates: Partial<Ticket> = {
          messages: arrayUnion(newMessage) as any
      };
      if (newStatus && newStatus !== ticket.status) {
          updates.status = newStatus;
      }
      await updateDoc(ticketDocRef, updates);

      setReplyMessage('');
      toast({ title: 'تم إرسال الرد بنجاح.' });
    } catch (error) {
      console.error("Reply error:", error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'لم نتمكن من إرسال الرد.' });
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

  if (!ticket || !userId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">التذكرة غير موجودة</h2>
        <p className="text-muted-foreground">تأكد من صحة الرابط أو أن المستخدم لم يقم بحذف التذكرة.</p>
        <Button asChild className="mt-4">
            <Link href="/admin/support">العودة إلى الدعم</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/support">
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
                    المستخدم: <span className="font-mono">{userId}</span> | تاريخ الإنشاء: {new Date(ticket.createdDate).toLocaleString('ar-EG')}
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
                <form onSubmit={handleReply} className="w-full flex flex-col gap-4">
                    <Textarea
                        placeholder="اكتب ردك هنا..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        required
                        className="flex-1"
                        rows={3}
                    />
                    <div className="flex items-center justify-between">
                         <div className="w-1/3">
                            <Select onValueChange={(v) => setNewStatus(v as Status)} value={newStatus || ticket.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="تغيير الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="مفتوحة">مفتوحة</SelectItem>
                                    <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
                                    <SelectItem value="مغلقة">مغلقة</SelectItem>
                                </SelectContent>
                            </Select>
                         </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin ml-2" /> : <Send className="ml-2"/>}
                            إرسال الرد
                        </Button>
                    </div>
                </form>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
