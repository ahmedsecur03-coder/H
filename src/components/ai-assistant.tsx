"use client";

import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, CornerDownLeft, Loader2, Sparkles, XCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { aiSupportUsers } from '@/ai/flows/ai-support-users';
import ReactMarkdown from 'react-markdown';
import { isAiConfigured } from '@/ai/genkit';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

// Define the structure for a single message in the chat
type Message = {
  role: 'user' | 'model' | 'system';
  content: string;
};

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'مرحباً بك في مركز المساعدة الذكي! كيف يمكنني مساعدتك اليوم في منصة حاجاتي؟',
    },
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check configuration only on the client-side
    setIsConfigured(isAiConfigured());
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || running || !isConfigured) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setRunning(true);

    try {
      const response = await aiSupportUsers({ query: input });
      const botMessage: Message = { role: 'model', content: response.response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'model',
        content: 'عذراً، حدث خطأ ما أثناء محاولة معالجة طلبك. يرجى المحاولة مرة أخرى.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setRunning(false);
    }
  };

  const UserMessage = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3 justify-end">
      <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs break-words">
        <p className="text-sm">{children}</p>
      </div>
       <Avatar className="w-8 h-8">
        <AvatarFallback><User size={18} /></AvatarFallback>
      </Avatar>
    </div>
  );
  
  const BotMessage = ({ children }: { children: React.ReactNode }) => (
     <div className="flex items-start gap-3">
       <Avatar className="w-8 h-8 bg-accent text-accent-foreground">
        <AvatarFallback><Bot size={18} /></AvatarFallback>
      </Avatar>
       <div className="bg-muted p-3 rounded-lg max-w-xs break-words prose prose-sm prose-invert">
         <ReactMarkdown
            components={{
                p: ({node, ...props}) => <p className="text-sm text-foreground" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="text-foreground" {...props} />,
            }}
         >{String(children)}</ReactMarkdown>
      </div>
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg bg-gradient-to-tr from-primary to-accent hover:scale-110 transition-transform duration-300"
        size="icon"
      >
        <Sparkles className="h-7 w-7" />
        <span className="sr-only">افتح المساعد الذكي</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col" side="left">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-headline">
              <Bot />
              المساعد الذكي
            </SheetTitle>
          </SheetHeader>
          <Separator />
          {!isConfigured ? (
             <div className="flex-1 flex items-center justify-center">
                 <Alert variant="destructive" className="border-destructive/20">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>خدمة غير متاحة</AlertTitle>
                    <AlertDescription>
                        المساعد الذكي غير متاح حالياً. يرجى المحاولة مرة أخرى لاحقاً.
                    </AlertDescription>
                </Alert>
             </div>
          ): (
            <>
                <ScrollArea className="flex-1 -mx-6 px-6" ref={scrollAreaRef}>
                    <div className="space-y-4 py-4">
                        {messages.map((msg, index) => (
                            <div key={index}>
                                {msg.role === 'user' && <UserMessage>{msg.content}</UserMessage>}
                                {(msg.role === 'model' || msg.role === 'system') && <BotMessage>{msg.content}</BotMessage>}
                            </div>
                        ))}
                        {running && (
                        <BotMessage>
                            <Loader2 className="animate-spin" />
                        </BotMessage>
                        )}
                    </div>
                </ScrollArea>
                <SheetFooter>
                    <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="اسأل عن خدمة معينة..."
                        disabled={running}
                        dir="auto"
                    />
                    <Button type="submit" size="icon" disabled={running}>
                        {running ? <Loader2 className="animate-spin" /> : <CornerDownLeft />}
                        <span className="sr-only">إرسال</span>
                    </Button>
                    </form>
                </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
