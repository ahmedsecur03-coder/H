
'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Ticket } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { replyToTicket } from '../actions';

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

export function TicketChat({ ticket }: { ticket: Ticket }) {
  const { toast } = useToast();
  const router = useRouter();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 0);
        }
    }
  }, [ticket?.messages]);


  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !ticket) return;

    setIsSubmitting(true);
    try {
        await replyToTicket(ticket.id, replyMessage);
        setReplyMessage('');
        toast({ title: 'تم إرسال ردك بنجاح.' });
        router.refresh(); // Refresh the page to show new message
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
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
    </>
  );
}
