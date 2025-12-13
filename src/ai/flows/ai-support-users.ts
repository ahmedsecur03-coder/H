
'use server';

/**
 * @fileOverview This file defines the AI support user flow for the application.
 *
 * - aiSupportUsers - A function that provides AI support to users.
 */

import {ai} from '@/ai/genkit';
import { collection, getDocs, query, where, orderBy, limit, addDoc } from 'firebase/firestore';
import { initializeFirebaseServer } from '@/firebase/server';
import type { Service, Order, Ticket } from '@/lib/types';
import { AISupportUsersInputSchema, AISupportUsersOutputSchema, type AISupportUsersInput, type AISupportUsersOutput } from './ai-support-types';
import { z } from 'zod';


// Tool to get available services from Firestore
const getAvailableServices = ai.defineTool(
    {
        name: 'getAvailableServices',
        description: 'Get a list of available services based on a search query. Use this to answer user questions about specific services.',
        inputSchema: z.object({
            query: z.string().describe('A search term to filter services, like "instagram followers" or "youtube views".'),
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            category: z.string(),
            platform: z.string(),
            price: z.number(),
        })),
    },
    async (input) => {
        const { firestore } = initializeFirebaseServer();
        if (!firestore) return [];

        try {
            const servicesRef = collection(firestore, 'services');
            const querySnapshot = await getDocs(servicesRef);
            
            const allServices: Service[] = [];
            querySnapshot.forEach(doc => {
                allServices.push({ id: doc.id, ...doc.data() } as Service);
            });
            
            const searchTerms = input.query.toLowerCase().split(' ');
            
            const filteredServices = allServices.filter(service => {
                const serviceText = `${service.platform} ${service.category}`.toLowerCase();
                return searchTerms.every(term => serviceText.includes(term));
            }).slice(0, 5);
            
            return filteredServices.map(({ id, category, platform, price }) => ({ id, category, platform, price }));

        } catch (error) {
            console.error("AI Tool Error (getAvailableServices):", error);
            return [];
        }
    }
);

// Tool to get a user's order history
const getUserOrders = ai.defineTool(
    {
        name: 'getUserOrders',
        description: "Get the user's order history. Use this to answer questions about their recent orders, check the status of an order, or find a specific order.",
        inputSchema: z.object({
            userId: z.string().describe("The user's unique ID."),
            orderId: z.string().optional().describe("A specific order ID to look for."),
            serviceQuery: z.string().optional().describe("A search term to find orders for a specific service, e.g., 'Instagram Followers'."),
        }),
        outputSchema: z.array(z.object({
            id: z.string(),
            serviceName: z.string(),
            status: z.string(),
            orderDate: z.string(),
            charge: z.number()
        })),
    },
    async (input) => {
        const { firestore } = initializeFirebaseServer();
        if (!firestore || !input.userId) {
            return [];
        }

        try {
            let q = query(collection(firestore, `users/${input.userId}/orders`), orderBy('orderDate', 'desc'), limit(10));

            const querySnapshot = await getDocs(q);
            let orders: Order[] = [];
            querySnapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() } as Order);
            });

            if (input.orderId) {
                orders = orders.filter(order => order.id.startsWith(input.orderId!));
            }
            
            if (input.serviceQuery) {
                orders = orders.filter(order => order.serviceName.toLowerCase().includes(input.serviceQuery!.toLowerCase()));
            }

            return orders.slice(0, 5).map(({ id, serviceName, status, orderDate, charge }) => ({ id, serviceName, status, orderDate, charge }));

        } catch (error) {
            console.error("AI Tool Error (getUserOrders):", error);
            return [];
        }
    }
);

// Tool to create a support ticket
const createSupportTicket = ai.defineTool(
    {
        name: 'createSupportTicket',
        description: "Creates a new support ticket for the user when they have a problem that can't be solved with other tools. Always ask for user confirmation before using this tool.",
        inputSchema: z.object({
            userId: z.string().describe("The user's unique ID."),
            subject: z.string().describe("A concise summary of the user's problem."),
            message: z.string().describe("A detailed description of the user's problem, based on the conversation history."),
        }),
        outputSchema: z.object({
            ticketId: z.string(),
        }),
    },
    async (input) => {
        const { firestore } = initializeFirebaseServer();

        if (!firestore || !input.userId) {
            throw new Error("User must be logged in to create a ticket.");
        }
        
        try {
            const newTicket: Omit<Ticket, 'id'> = {
                userId: input.userId,
                subject: input.subject,
                message: input.message,
                status: 'مفتوحة',
                createdDate: new Date().toISOString(),
                messages: [{
                    sender: 'user',
                    text: input.message,
                    timestamp: new Date().toISOString(),
                }],
            };

            const ticketsColRef = collection(firestore, `users/${input.userId}/tickets`);
            const docRef = await addDoc(ticketsColRef, newTicket);

            return { ticketId: docRef.id };
        } catch (error) {
            console.error("AI Tool Error (createSupportTicket):", error);
            throw new Error("Failed to create support ticket.");
        }
    }
);

const AISupportServerInputSchema = AISupportUsersInputSchema.extend({
    userId: z.string().describe("The user's unique ID."),
});

export async function aiSupportUsers(input: AISupportUsersInput, userId: string | null): Promise<AISupportUsersOutput> {
  if (!userId) {
    return { response: "يرجى تسجيل الدخول أولاً لاستخدام المساعد الذكي." };
  }
  
  const flowInput = {
    query: input.query,
    userId: userId,
  };

  return aiSupportUsersFlow(flowInput);
}

const prompt = ai.definePrompt({
  name: 'aiSupportUsersPrompt',
  input: {schema: AISupportServerInputSchema},
  output: {schema: AISupportUsersOutputSchema},
  tools: [getAvailableServices, getUserOrders, createSupportTicket],
  prompt: `You are a friendly and helpful AI assistant for the Hajaty Hub platform.
  Your responses must always be in Arabic.
  
  When users ask about services, use the 'getAvailableServices' tool.
  - If you find services, present them in a clear, bulleted list.
  - For each service, you MUST mention the service ID (معرف الخدمة), a brief description, and the price per 1000.
  - If you don't find any services matching the query, politely inform the user.

  When users ask about their orders (e.g., "what's my last order?", "status of order X"), use the 'getUserOrders' tool. You must pass the 'userId' from the input to this tool.
  - Present the orders in a clear, bulleted list.
  - For each order, mention the Order ID, Service Name, Status, and Date.
  - If no orders are found, inform the user politely.
  
  If the user describes a problem that cannot be resolved with the available tools (e.g., an order is stuck, a payment failed, they need a refund), you should offer to create a support ticket for them.
  - First, propose opening a ticket by saying something like: "أرى أنك تواجه مشكلة. هل تود مني فتح تذكرة دعم فني لك وسيقوم الفريق بمراجعتها؟"
  - If the user agrees (e.g., says "نعم", "افتح تذكرة", "موافق"), then and ONLY then, use the 'createSupportTicket' tool. You must pass the 'userId' from the input to this tool.
  - For the 'subject' of the ticket, create a short, clear summary of the issue.
  - For the 'message', use the user's own words from the query to describe the problem.
  - After successfully creating the ticket, respond with: "لقد قمت بإنشاء تذكرة دعم لك. سيقوم فريقنا بمراجعتها والرد في أقرب وقت. هل يمكنني مساعدتك في شيء آخر؟"
  - If the user does not want to create a ticket, just be helpful and ask if there is anything else you can assist with.

  Be conversational and helpful. Unless you are creating a ticket, end your response by asking if there is anything else you can help with.

  User ID: {{{userId}}}
  User Query: {{{query}}}`,
});

const aiSupportUsersFlow = ai.defineFlow(
  {
    name: 'aiSupportUsersFlow',
    inputSchema: AISupportServerInputSchema,
    outputSchema: AISupportUsersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
