
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { Service, Order, User, ServicePrice } from '@/lib/types';
import { serverProcessOrderInTransaction } from '@/lib/server-service';
import { SMM_SERVICES } from '@/lib/smm-services';
import { PROFIT_MARGIN } from '@/lib/constants';
import { z } from 'zod';

// Helper function to find user by API key
async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const { firestore } = initializeFirebaseServer();
  if (!firestore) {
    throw new Error('Firestore is not initialized on the server.');
  }

  const usersRef = firestore.collection('users');
  const snapshot = await usersRef.where('apiKey', '==', apiKey).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
}

// Zod schemas for input validation
const BaseSchema = z.object({
  key: z.string().startsWith('hy_'),
  action: z.enum(['services', 'balance', 'add', 'status']),
});

const AddOrderSchema = z.object({
    service: z.union([z.string(), z.number()]),
    link: z.string().url(),
    quantity: z.number().int().min(1),
});

const StatusSchema = z.object({
  order: z.union([z.string(), z.number()]),
});


// Handler for POST requests
export async function POST(request: NextRequest) {
    const { firestore } = initializeFirebaseServer();
    if (!firestore) {
        return NextResponse.json({ error: 'Server error: Could not connect to database.' }, { status: 500 });
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON format in request body' }, { status: 400 });
    }
    
    // --- Basic Validation ---
    const baseParse = BaseSchema.safeParse(body);
    if (!baseParse.success) {
        return NextResponse.json({ error: 'Invalid or missing parameters: key, action' }, { status: 400 });
    }
    
    const { key, action, ...params } = body;

    try {
        const user = await getUserByApiKey(key);
        if (!user) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }
        
        // --- Admin-only action check ---
        // Example: If there was an admin-only action, we would check it here
        // if (action === 'some_admin_action' && user.role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized action' }, { status: 403 });
        // }

        // Log the API action
        const logData = {
            event: 'api_request',
            level: 'info' as const,
            message: `API action '${action}' called by user ${user.id}`,
            timestamp: new Date().toISOString(),
            metadata: { userId: user.id, action, params: action === 'add' ? {service: params.service, quantity: params.quantity} : params },
        };
        // We do this in the background, no need to await it
        firestore.collection('systemLogs').add(logData);


        switch (action) {
            case 'services': {
                // Fetch dynamic prices from Firestore
                const pricesSnapshot = await firestore.collection('servicePrices').get();
                const pricesMap = new Map<string, number>();
                pricesSnapshot.forEach(doc => {
                    const data = doc.data() as ServicePrice;
                    pricesMap.set(doc.id, data.price);
                });

                // Merge static service data with dynamic prices
                const mergedServices = SMM_SERVICES.map(service => {
                    const dynamicPrice = pricesMap.get(String(service.id));
                    const price = dynamicPrice ?? service.price; // Fallback to static price
                    const finalPrice = price * PROFIT_MARGIN; // Apply profit margin

                    return {
                        service: service.id,
                        name: `${service.platform} - ${service.category}`,
                        type: "Default",
                        category: service.category,
                        rate: finalPrice.toFixed(4),
                        min: service.min,
                        max: service.max,
                    }
                });

                return NextResponse.json(mergedServices);
            }

            case 'balance': {
                return NextResponse.json({
                    balance: user.balance.toFixed(4),
                    currency: 'USD'
                });
            }

            case 'add': {
                 // --- 'add' action specific validation ---
                const addOrderParse = AddOrderSchema.safeParse(params);
                if (!addOrderParse.success) {
                    return NextResponse.json({ error: 'Invalid parameters for add action', details: addOrderParse.error.flatten() }, { status: 400 });
                }
                const { service: serviceId, link, quantity } = addOrderParse.data;
                
                const staticService = SMM_SERVICES.find(s => String(s.id) === String(serviceId));
                if (!staticService) {
                    return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
                }

                // Fetch the dynamic price for this specific service
                const priceDoc = await firestore.collection('servicePrices').doc(String(serviceId)).get();
                const price = priceDoc.exists ? (priceDoc.data() as ServicePrice).price : staticService.price;
                const finalPrice = price * PROFIT_MARGIN; // Apply profit margin

                const mergedService = { ...staticService, price: finalPrice };

                if (quantity < mergedService.min || quantity > mergedService.max) {
                    return NextResponse.json({ error: `Quantity must be between ${mergedService.min} and ${mergedService.max}` }, { status: 400 });
                }
                
                // Server-side cost calculation
                const cost = (quantity / 1000) * mergedService.price;
                
                if (user.balance < cost) {
                    return NextResponse.json({ error: 'Not enough funds' }, { status: 400 });
                }
                
                const orderData: Omit<Order, 'id'> = {
                    userId: user.id,
                    serviceId: mergedService.id,
                    serviceName: `${mergedService.platform} - ${mergedService.category}`,
                    link: link,
                    quantity: quantity,
                    charge: cost, // Will be recalculated inside serverProcessOrderInTransaction with discount
                    orderDate: new Date().toISOString(),
                    status: 'قيد التنفيذ',
                };
                
                const { orderId } = await firestore.runTransaction(async (transaction) => {
                     return await serverProcessOrderInTransaction(transaction, firestore, user.id, orderData);
                });


                return NextResponse.json({ order: orderId });
            }

            case 'status': {
                 // --- 'status' action specific validation ---
                 const statusParse = StatusSchema.safeParse(params);
                 if (!statusParse.success) {
                     return NextResponse.json({ error: 'Invalid or missing `order` parameter' }, { status: 400 });
                 }
                const { order: orderId } = statusParse.data;

                // Query for the order within the user's subcollection
                const orderDocRef = firestore.collection(`users/${user.id}/orders`).doc(String(orderId));
                const orderDoc = await orderDocRef.get();

                if (!orderDoc.exists) {
                    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
                }
                const order = orderDoc.data() as Order;
                
                return NextResponse.json({
                    charge: order.charge.toFixed(4),
                    start_count: "0", // Placeholder
                    status: order.status,
                    remains: "0", // Placeholder
                    currency: "USD"
                });
            }

            default:
                // This case should not be reachable due to the enum in BaseSchema
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('API Error:', error);
        // Log critical errors to systemLogs
         firestore.collection('systemLogs').add({
            event: 'api_error',
            level: 'error' as const,
            message: `API action '${action}' failed for user ${body.key?.substring(0, 6)}...`,
            timestamp: new Date().toISOString(),
            metadata: { error: error.message, stack: error.stack, body },
        });
        return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
