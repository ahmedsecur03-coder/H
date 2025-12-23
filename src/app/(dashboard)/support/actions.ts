'use server';

import { getAuthenticatedUser } from '@/firebase/server-auth';
import { initializeFirebaseServer } from '@/firebase/server';
import { revalidatePath } from 'next/cache';
import type { Ticket } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function createTicket(data: { subject: string; message: string }): Promise<string> {
    const { user } = await getAuthenticatedUser();
    const { firestore } = initializeFirebaseServer();

    if (!user || !firestore) {
        throw new Error("المستخدم غير مصادق عليه أو فشل تهيئة Firebase.");
    }
    
    if(!data.subject || !data.message) {
        throw new Error("الموضوع والرسالة مطلوبان.");
    }

    const newTicket: Omit<Ticket, 'id'> = {
        userId: user.uid,
        subject: data.subject,
        message: data.message,
        status: 'مفتوحة',
        createdDate: new Date().toISOString(),
        messages: [{
            sender: 'user',
            text: data.message,
            timestamp: new Date().toISOString()
        }]
    };

    try {
        const ticketRef = await firestore.collection(`users/${user.uid}/tickets`).add(newTicket);
        revalidatePath('/dashboard/support');
        return ticketRef.id;
    } catch (error: any) {
        console.error("Error creating ticket:", error);
        throw new Error("فشل إنشاء تذكرة الدعم.");
    }
}
