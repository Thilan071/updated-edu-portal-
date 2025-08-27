// lib/firebaseAdmin.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Check if required environment variables are set
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'Missing Firebase Admin SDK credentials. Please check your .env.local file and ensure you have set:\n' +
    '- FIREBASE_PROJECT_ID\n' +
    '- FIREBASE_CLIENT_EMAIL\n' +
    '- FIREBASE_PRIVATE_KEY\n\n' +
    'See GET_SERVICE_ACCOUNT.md for detailed instructions.'
  );
}

// Check if credentials are still placeholder values
if (process.env.FIREBASE_CLIENT_EMAIL === 'your_service_account_email' || 
    process.env.FIREBASE_PRIVATE_KEY === '"your_private_key"') {
  throw new Error(
    'Firebase Admin SDK credentials are still using placeholder values. ' +
    'Please replace them with actual values from your Firebase service account. ' +
    'See GET_SERVICE_ACCOUNT.md for instructions.'
  );
}

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};

// Initialize Firebase Admin (avoid multiple initialization)
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
} catch (error) {
  if (error.message.includes('Invalid PEM formatted message')) {
    throw new Error(
      'Invalid Firebase private key format. Please ensure you have:\n' +
      '1. Copied the ENTIRE private key from your service account JSON file\n' +
      '2. Wrapped it in double quotes\n' +
      '3. Used \\n for line breaks\n\n' +
      'See GET_SERVICE_ACCOUNT.md for detailed instructions and troubleshooting.'
    );
  }
  throw error;
}

export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);

export default app;