
import admin from 'firebase-admin';

// This function ensures that we initialize the app only once.
// It's safe to call this function multiple times.
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0] as admin.app.App;
  }

  // Check if the service account environment variable is set.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set. Cannot initialize Firebase Admin SDK.');
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (error: any) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize Firebase Admin:', error);
    throw new Error('Firebase Admin SDK initialization failed.');
  }
}

// Initialize the app and export the firestore instance.
const firebaseAdminApp = initializeFirebaseAdmin();
const firestoreAdmin = admin.firestore();

export { firebaseAdminApp, firestoreAdmin };
