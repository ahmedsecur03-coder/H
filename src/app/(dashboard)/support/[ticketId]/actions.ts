'use server';

import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

export async function replyToTicket(ticketId: string, replyMessage: string) {
    const { user } = await getAuthenticatedUser();
    const { firestore } = initializeFirebaseServer();

    if (!user || !firestore) {
        throw new Error("المستخدم غير مصادق عليه أو فشل تهيئة Firebase.");
    }

    if (!replyMessage.trim()) {
        throw new Error("لا يمكن إرسال رسالة فارغة.");
    }

    const ticketRef = firestore.doc(`users/${user.uid}/tickets/${ticketId}`);
    
    const newMessage = {
        sender: 'user',
        text: replyMessage,
        timestamp: new Date().toISOString()
    };

    try {
        await ticketRef.update({
            messages: FieldValue.arrayUnion(newMessage),
            status: 'قيد المراجعة' // Re-open ticket on user reply
        });
        revalidatePath(`/dashboard/support/${ticketId}`);
    } catch (error: any) {
        console.error("Error replying to ticket:", error);
        throw new Error("فشل إرسال الرد.");
    }
}
