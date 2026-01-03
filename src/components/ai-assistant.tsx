'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { hajatyAssistant } from '@/ai/flows/hajaty-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { isAiConfigured } from '@/ai/client';

type Message = {
  sender: 'user' | 'ai';
  text: string;
};

export function AiAssistant({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  if (!isAiConfigured()) {
      return null;
  }

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          sender: 'ai',
          text: 'أهلاً بك يا رائد الفضاء! أنا مساعدك الذكي في منصة حاجاتي. كيف يمكنني خدمتك اليوم؟',
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 100);
        }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await hajatyAssistant({ query: input });
      const aiMessage: Message = { sender: 'ai', text: result.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء التواصل مع المساعد الذكي.',
      });
      const errorMessage: Message = { sender: 'ai', text: 'عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed bottom-24 left-6 z-50 w-[90vw] max-w-sm h-[60vh] max-h-[500px] bg-card/80 backdrop-blur-lg rounded-2xl shadow-2xl border flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">المساعد الذكي</h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   {msg.sender === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                     <ReactMarkdown
                        components={{
                            p: ({node, ...props}) => <p className="m-0" {...props} />,
                        }}
                     >
                        {msg.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="bg-muted rounded-lg px-3 py-2 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="relative">
              <Input
                placeholder="اسأل أي شيء عن المنصة..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="pe-12 h-11"
              />
              <Button
                size="icon"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleSend}
                disabled={loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
