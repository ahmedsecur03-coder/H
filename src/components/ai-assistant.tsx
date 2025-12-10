"use client";

import { useState } from 'react';
// import { useFlow, type Flow } from '@genkit-ai/react-runtime';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, CornerDownLeft, Loader2, Sparkles } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import type { AISupportUsersOutput, AISupportUsersInput } from '@/ai/flows/ai-support-users';
import { aiSupportUsers as aiSupportUsersFlow } from '@/ai/flows/ai-support-users';

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  
  // const [flow, setFlow] = useState<Flow<AISupportUsersInput, AISupportUsersOutput>>();

  // const { messages, run, running } = useFlow(flow);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage = { query: input };
    setInput('');
    // run(userMessage);
  };

  const UserMessage = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-start gap-3 justify-end">
      <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
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
      <div className="bg-muted p-3 rounded-lg max-w-xs">
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );

  const openAssistant = () => {
    // setFlow(() => aiSupportUsersFlow);
    setOpen(true);
  }

  const running = false;
  const messages: any[] = [];

  return (
    <>
      <Button
        onClick={openAssistant}
        className="fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg"
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
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
                <BotMessage>
                    مرحباً بك في مركز المساعدة الذكي! كيف يمكنني مساعدتك اليوم في منصة حاجاتي؟
                </BotMessage>
                 {messages.map((msg: any) => (
                    <div key={msg.key}>
                        {msg.role === 'user' && <UserMessage>{(msg.content as AISupportUsersInput).query}</UserMessage>}
                        {msg.role === 'model' && <BotMessage>{(msg.content as AISupportUsersOutput).response}</BotMessage>}
                    </div>
                ))}
            </div>
          </ScrollArea>
          <SheetFooter>
            <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسأل عن أي شيء..."
                disabled={running}
              />
              <Button type="submit" size="icon" disabled={running}>
                {running ? <Loader2 className="animate-spin" /> : <CornerDownLeft />}
                <span className="sr-only">إرسال</span>
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
