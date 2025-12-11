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
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Service } from '@/lib/types';

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
        console.log(`Tool getAvailableServices called with query: ${input.query}`);
        const { firestore } = initializeFirebase();
        if (!firestore) {
            console.error("Firestore not initialized");
            return [];
        }

        try {
            // A simple text search simulation by checking for keywords.
            // For a real app, a more sophisticated search like Algolia or Typesense is recommended.
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
            }).slice(0, 5); // Limit to 5 results to keep the response concise
            
            console.log(`Found ${filteredServices.length} services matching query.`);

            return filteredServices.map(({ id, category, platform, price }) => ({ id, category, platform, price }));

        } catch (error) {
            console.error("Error fetching services in tool:", error);
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
  tools: [getAvailableServices],
  prompt: `You are a friendly and helpful AI assistant for the Hajaty Hub platform.
  Your responses must always be in Arabic.
  
  When users ask about services, use the 'getAvailableServices' tool.
  - If you find services, present them in a clear, bulleted list.
  - For each service, you MUST mention the service ID (معرف الخدمة), a brief description, and the price per 1000.
  - If you don't find any services matching the query, politely inform the user.
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
