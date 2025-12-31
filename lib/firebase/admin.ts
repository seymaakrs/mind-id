import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let app: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let adminStorage: Storage | null = null;

// Check if all required environment variables are present
const hasRequiredEnvVars =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

// Check if private key looks valid (not placeholder)
const isValidPrivateKey =
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_PRIVATE_KEY.includes('PRIVATE KEY') &&
  !process.env.FIREBASE_PRIVATE_KEY.includes('YOUR_PRIVATE_KEY') &&
  !process.env.FIREBASE_PRIVATE_KEY.includes('BURAYA_GERCEK');

if (hasRequiredEnvVars && isValidPrivateKey) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    app = getApps().length === 0
      ? initializeApp({
          credential: cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        })
      : getApps()[0];

    adminAuth = getAuth(app);
    adminDb = getFirestore(app);
    adminStorage = getStorage(app);
  } catch (error) {
    console.error('Firebase Admin SDK initialization failed:', error);
    console.warn(
      'Please check your FIREBASE_PRIVATE_KEY format in .env.local. ' +
      'Make sure it includes the full key from the service account JSON file.'
    );
  }
} else if (typeof window === 'undefined') {
  if (!hasRequiredEnvVars) {
    console.warn(
      'Firebase Admin SDK: Missing required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)'
    );
  } else if (!isValidPrivateKey) {
    console.warn(
      'Firebase Admin SDK: FIREBASE_PRIVATE_KEY appears to be a placeholder. ' +
      'Please update .env.local with the real private key from Firebase Console.'
    );
  }
}

export { adminAuth, adminDb, adminStorage };
export default app;
