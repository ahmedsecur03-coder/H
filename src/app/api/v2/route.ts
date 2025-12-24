'use server';

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebaseServer } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import type { Service, Order, User } from '@/lib/types';
import { processOrderInTransaction as serverProcessOrderInTransaction } from '@/lib/server-service';

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

        switch (action) {
            case 'services': {
                const servicesSnapshot = await firestore.collection('services').get();
                const services = servicesSnapshot.docs.map(doc => {
                    const data = doc.data() as Service;
                    return {
                        service: data.id,
                        name: `${data.platform} - ${data.category}`,
                        type: "Default",
                        category: data.category,
                        rate: data.price,
                        min: data.min,
                        max: data.max,
                    }
                });
                return NextResponse.json(services);
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

                const serviceDoc = await firestore.collection('services').doc(String(serviceId)).get();
                if (!serviceDoc.exists) {
                    return NextResponse.json({ error: 'Invalid service ID' }, { status: 400 });
                }
                const service = serviceDoc.data() as Service;

                const numQuantity = parseInt(quantity, 10);
                if (isNaN(numQuantity) || numQuantity < service.min || numQuantity > service.max) {
                    return NextResponse.json({ error: `Quantity must be between ${service.min} and ${service.max}` }, { status: 400 });
                }

                const cost = (numQuantity / 1000) * service.price; // Simplified cost, no discount via API for now
                if (user.balance < cost) {
                    return NextResponse.json({ error: 'Not enough funds' }, { status: 400 });
                }
                
                const orderData: Omit<Order, 'id'> = {
                    userId: user.id,
                    serviceId: service.id,
                    serviceName: `${service.platform} - ${service.category}`,
                    link: link,
                    quantity: numQuantity,
                    charge: cost, // Using simplified cost for now
                    orderDate: new Date().toISOString(),
                    status: 'قيد التنفيذ',
                };
                
                // Using a transaction for safety
                const newOrderId = await firestore.runTransaction(async (transaction) => {
                     return await serverProcessOrderInTransaction(transaction, firestore, user.id, orderData);
                });


                return NextResponse.json({ order: newOrderId });
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
