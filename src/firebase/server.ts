import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', e);
      return undefined;
    }
  }
  return undefined;
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebaseServer() {
  const serviceAccount = getServiceAccount();

  if (!getApps().length) {
    const app = initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : undefined,
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
      projectId: firebaseConfig.projectId,
    });
    return getSdks(app);
  }
  return getSdks(getApps()[0]);
}

export function getSdks(app: App) {
  const firestore = getFirestore(app);
  return {
    firebaseApp: app,
    firestore,
  };
}
