'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { WhatsAppIcon } from './ui/icons';
import { Bot, MessageCircle } from 'lucide-react';
import { AiAssistant } from './ai-assistant';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function FloatingActionButtons() {
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'global') : null), [firestore]);
    const { data: settingsData } = useDoc<any>(settingsDocRef);
    
    const whatsappLink = settingsData?.whatsappSupport || '#';

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 items-center">
             <AiAssistant open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />

            <Button
                size="icon"
                className="rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                onClick={() => setIsAssistantOpen(true)}
                aria-label="Open AI Assistant"
            >
                <Bot className="h-7 w-7" />
            </Button>
            
            <Button asChild size="icon" className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 text-white shadow-lg">
                <Link href={whatsappLink} target="_blank" aria-label="Contact on WhatsApp">
                    <WhatsAppIcon className="h-7 w-7" />
                </Link>
            </Button>
        </div>
    );
}
