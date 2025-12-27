
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { Service, Order, User, ServicePrice } from '@/lib/types';
import { serverProcessOrderInTransaction } from '@/lib/server-service';
import { SMM_SERVICES } from '@/lib/smm-services';

// Helper function to find user by API key
async function getUserByApiKey(apiKey: string) {
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

// Handler for GET requests (can be used for simple status checks if needed)
export async function GET(request: NextRequest) {
    return NextResponse.json({ message: 'Hajaty API v2 is active. Please use POST requests to interact.' });
}


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
    
    const { key, action, ...params } = body;

    if (!key) {
        return NextResponse.json({ error: 'API key is missing' }, { status: 401 });
    }

    try {
        const user = await getUserByApiKey(key);
        if (!user) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
        }

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
                    const finalPrice = price * 1.50; // Apply 50% profit margin

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
                const { service: serviceId, link, quantity } = params;
                if (!serviceId || !link || !quantity) {
                    return NextResponse.json({ error: 'Missing parameters for add action (service, link, quantity)' }, { status: 400 });
                }
                
                const staticService = SMM_SERVICES.find(s => s.id === String(serviceId));
                if (!staticService) {
                    return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
                }

                // Fetch the dynamic price for this specific service
                const priceDoc = await firestore.collection('servicePrices').doc(String(serviceId)).get();
                const price = priceDoc.exists ? (priceDoc.data() as ServicePrice).price : staticService.price;
                const finalPrice = price * 1.50; // Apply 50% profit margin

                const mergedService = { ...staticService, price: finalPrice };

                const numQuantity = parseInt(quantity, 10);
                if (isNaN(numQuantity) || numQuantity < mergedService.min || numQuantity > mergedService.max) {
                    return NextResponse.json({ error: `Quantity must be between ${mergedService.min} and ${mergedService.max}` }, { status: 400 });
                }
                
                // Server-side cost calculation
                const cost = (numQuantity / 1000) * mergedService.price;
                
                if (user.balance < cost) {
                    return NextResponse.json({ error: 'Not enough funds' }, { status: 400 });
                }
                
                const orderData: Omit<Order, 'id'> = {
                    userId: user.id,
                    serviceId: mergedService.id,
                    serviceName: `${mergedService.platform} - ${mergedService.category}`,
                    link: link,
                    quantity: numQuantity,
                    charge: cost,
                    orderDate: new Date().toISOString(),
                    status: 'قيد التنفيذ',
                };
                
                const { orderId } = await firestore.runTransaction(async (transaction) => {
                     return await serverProcessOrderInTransaction(transaction, firestore, user.id, orderData);
                });


                return NextResponse.json({ order: orderId });
            }

            case 'status': {
                const { order: orderId } = params;
                if (!orderId) {
                    return NextResponse.json({ error: 'Order ID is missing' }, { status: 400 });
                }

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
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
    }
}
