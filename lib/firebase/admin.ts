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

/**
 * Generate a signed URL for a file in Firebase Storage
 * @param storagePath - The path to the file in storage (e.g., "businesses/abc/media/image.jpg")
 * @param expiresInMinutes - How long the URL should be valid (default: 60 minutes)
 * @returns The signed URL or null if generation fails
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInMinutes: number = 60
): Promise<string | null> {
  if (!adminStorage) {
    console.error('Firebase Admin Storage not initialized');
    return null;
  }

  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(storagePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`File not found: ${storagePath}`);
      return null;
    }

    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return signedUrl;
  } catch (error) {
    console.error(`Error generating signed URL for ${storagePath}:`, error);
    return null;
  }
}

/**
 * Generate signed URLs for multiple files
 * @param storagePaths - Array of storage paths
 * @param expiresInMinutes - How long the URLs should be valid
 * @returns Map of storage_path to signed URL
 */
export async function getSignedUrls(
  storagePaths: string[],
  expiresInMinutes: number = 60
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  await Promise.all(
    storagePaths.map(async (path) => {
      const signedUrl = await getSignedUrl(path, expiresInMinutes);
      if (signedUrl) {
        results.set(path, signedUrl);
      }
    })
  );

  return results;
}

export { adminAuth, adminDb, adminStorage };
export default app;
