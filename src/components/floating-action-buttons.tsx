'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { WhatsAppIcon } from './ui/icons';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AiAssistant } from './ai-assistant';
import { Bot } from 'lucide-react';

export function FloatingActionButtons() {
    const firestore = useFirestore();
    const settingsDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'global') : null), [firestore]);
    const { data: settingsData } = useDoc<any>(settingsDocRef);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    
    const whatsappLink = settingsData?.whatsappSupport || '#';

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                 <Button asChild size="icon" className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 text-white shadow-lg">
                    <Link href={whatsappLink} target="_blank" aria-label="Contact on WhatsApp">
                        <WhatsAppIcon className="h-7 w-7" />
                    </Link>
                </Button>
            </div>
             <div className="fixed bottom-6 left-6 z-50">
                 <Button
                    size="icon"
                    className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 text-white shadow-lg"
                    onClick={() => setIsAssistantOpen(true)}
                    aria-label="Open AI Assistant"
                >
                    <Bot className="h-7 w-7" />
                </Button>
            </div>
            <AiAssistant open={isAssistantOpen} onOpenChange={setIsAssistantOpen} />
        </>
    );
}
