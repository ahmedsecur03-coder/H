
'use server';
import { NextResponse } from 'next/server';

// This API route is intentionally disabled to conform to a client-only architecture.
// In a real-world scenario, this logic should be securely handled on a server.
export async function POST(request: Request) {
    return NextResponse.json({ error: 'This API endpoint is disabled. The application now operates in a client-only mode.' }, { status: 404 });
}
