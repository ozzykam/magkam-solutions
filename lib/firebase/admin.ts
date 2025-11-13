import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

/**
 * Initialize Firebase Admin SDK
 * This should only run on the server side
 */
export function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Initialize with service account credentials
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccount) {
      const error = new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. ' +
        'Please add your Firebase service account JSON to .env.local'
      );
      console.error('[Admin SDK]', error.message);
      throw error;
    }

    // Parse the service account JSON
    // Handle newline characters in private key (replace literal \n with actual newlines)
    const serviceAccountObj = JSON.parse(serviceAccount);

    // Ensure private_key has proper newline characters
    if (serviceAccountObj.private_key) {
      serviceAccountObj.private_key = serviceAccountObj.private_key.replace(/\\n/g, '\n');
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    adminApp = initializeApp({
      credential: cert(serviceAccountObj),
      projectId: projectId,
      databaseURL: `https://${projectId}.firebaseio.com`,
    });

    return adminApp;
  } catch (error) {
    console.error('[Admin SDK] Failed to initialize Firebase Admin SDK:', error);
    console.error('[Admin SDK] Full error:', error);
    throw error;
  }
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth() {
  const app = getAdminApp();
  return getAuth(app);
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminFirestore() {
  const app = getAdminApp();

  // Use the same database ID as the client-side config
  // This must match the database ID in lib/firebase/config.ts
  const databaseId = 'local-marketv2';
  const firestore = getFirestore(app, databaseId);

  return firestore;
}

/**
 * Verify Firebase ID token and return the decoded token
 */
export async function verifyIdToken(token: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

/**
 * Get user by UID
 */
export async function getUser(uid: string) {
  try {
    const auth = getAdminAuth();
    const userRecord = await auth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Set custom user claims (e.g., role)
 */
export async function setCustomClaims(uid: string, claims: Record<string, unknown>) {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return false;
  }
}

/**
 * Get user's role from Firestore
 */
export async function getUserRole(uid: string): Promise<string | null> {
  try {
    const firestore = getAdminFirestore();
    const userDoc = await firestore.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    const role = userData?.role || 'customer';

    return role;
  } catch (error) {
    console.error('[Admin SDK] Error getting user role:', error);
    return null;
  }
}
