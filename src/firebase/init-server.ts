import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// This function is intended for server-side use only (e.g., in Server Components, API Routes, sitemap generation)

let app: FirebaseApp;

// Singleton pattern to initialize Firebase app on the server
function getFirebaseApp() {
    if (getApps().length === 0) {
        // No apps initialized, create a new one. This will be the 'default' app.
        app = initializeApp(firebaseConfig);
    } else {
        // An app is already initialized, get the default app.
        // This avoids "Firebase: Firebase App named '[DEFAULT]' already exists" error.
        app = getApp();
    }
    return app;
}

/**
 * Initializes and returns a Firestore instance for server-side use.
 * This is safe to call multiple times.
 */
export function getFirestoreServer(): Firestore {
    const serverApp = getFirebaseApp();
    return getFirestore(serverApp);
}
