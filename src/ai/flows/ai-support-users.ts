'use server';

/**
 * @fileOverview This file defines the AI support user flow for the application.
 *
 * - aiSupportUsers - A function that provides AI support to users.
 * - AISupportUsersInput - The input type for the aiSupportUsers function.
 * - AISupportUsersOutput - The return type for the aiSupportUsers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Service, Order } from '@/lib/types';
import { getAuth } from 'firebase/auth';

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
        const { firestore } = initializeFirebase();
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
        const { auth, firestore } = initializeFirebase();
        const user = auth.currentUser;

        if (!firestore || !user) {
            return [];
        }

        try {
            let q = query(collection(firestore, `users/${user.uid}/orders`), orderBy('orderDate', 'desc'), limit(10));

            if (input.orderId) {
                // In a real app, you'd do a direct doc get, but for tool simplicity we'll filter client-side after a fetch.
                // This is not efficient for Firestore reads.
            }

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
            return [];
        }
    }
);


const AISupportUsersInputSchema = z.object({
  query: z.string().describe('The user query for AI support.'),
});
export type AISupportUsersInput = z.infer<typeof AISupportUsersInputSchema>;

const AISupportUsersOutputSchema = z.object({
  response: z.string().describe('The AI support response to the user query.'),
});
export type AISupportUsersOutput = z.infer<typeof AISupportUsersOutputSchema>;

export async function aiSupportUsers(input: AISupportUsersInput): Promise<AISupportUsersOutput> {
  return aiSupportUsersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSupportUsersPrompt',
  input: {schema: AISupportUsersInputSchema},
  output: {schema: AISupportUsersOutputSchema},
  tools: [getAvailableServices, getUserOrders],
  prompt: `You are a friendly and helpful AI assistant for the Hajaty Hub platform.
  Your responses must always be in Arabic.
  
  When users ask about services, use the 'getAvailableServices' tool.
  - If you find services, present them in a clear, bulleted list.
  - For each service, you MUST mention the service ID (معرف الخدمة), a brief description, and the price per 1000.
  - If you don't find any services matching the query, politely inform the user.

  When users ask about their orders (e.g., "what's my last order?", "status of order X"), use the 'getUserOrders' tool.
  - Present the orders in a clear, bulleted list.
  - For each order, mention the Order ID, Service Name, Status, and Date.
  - If no orders are found, inform the user politely.
  
  - Be conversational and helpful. End your response by asking if there is anything else you can help with.

  User Query: {{{query}}}`,
});

const aiSupportUsersFlow = ai.defineFlow(
  {
    name: 'aiSupportUsersFlow',
    inputSchema: AISupportUsersInputSchema,
    outputSchema: AISupportUsersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
