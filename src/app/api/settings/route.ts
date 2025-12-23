
import { initializeFirebaseServer } from '@/firebase/server';
import { NextResponse } from 'next/server';

// This function is marked with `export const dynamic = 'force-dynamic'` 
// to ensure it's always treated as a dynamic route, but the caching is handled by fetch.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { firestore } = initializeFirebaseServer();
  
  if (!firestore) {
    return NextResponse.json({ error: 'Firestore is not initialized on the server.' }, { status: 500 });
  }

  try {
    const settingsDoc = await firestore.collection('settings').doc('global').get();
    
    if (!settingsDoc.exists) {
      return NextResponse.json({ error: 'Global settings not found.' }, { status: 404 });
    }

    const settingsData = settingsDoc.data();
    
    // Return the settings data. The fetch call in `layout.tsx` will cache this response.
    return NextResponse.json(settingsData);

  } catch (error: any) {
    console.error('API Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings.', details: error.message }, { status: 500 });
  }
}
