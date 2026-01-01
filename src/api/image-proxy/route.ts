'use server';

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/firebase/server-auth';

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
      
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Basic validation to prevent abuse
    const url = new URL(imageUrl);
    const allowedHosts = ['images.unsplash.com', 'i.pravatar.cc', 'lh3.googleusercontent.com'];
    if (!allowedHosts.includes(url.hostname)) {
      return NextResponse.json({ error: 'Invalid image host' }, { status: 400 });
    }


    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUri });
  } catch (error: any) {
    console.error('Image Proxy Error:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}

export async function OPTIONS(request: Request) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
