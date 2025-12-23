'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Validate the URL to prevent potential SSRF attacks
    const url = new URL(imageUrl);
    const validHosts = ['i.pravatar.cc', 'images.unsplash.com', 'lh3.googleusercontent.com', 'placehold.co', 'picsum.photos'];
    if (!validHosts.includes(url.hostname)) {
        // Allow data URIs to pass through
        if (!url.protocol.startsWith('data:')) {
            return NextResponse.json({ error: 'Invalid image host' }, { status: 400 });
        }
    }
    
    // If it's already a data URI, just return it.
    if (url.protocol.startsWith('data:')) {
        return NextResponse.json({ dataUri: imageUrl });
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
