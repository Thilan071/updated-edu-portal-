// scripts/seed-admin-firebase.mjs
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const firebaseAdminConfig = {
  credential: cert({
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};

// Initialize Firebase Admin
const app = initializeApp(firebaseAdminConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function createAdminUser(email, password) {
  // Create Firebase Auth user first
  const authUser = await auth.createUser({
    email: email,
    password: password,
    displayName: 'System Admin',
    disabled: false,
  });

  // Hash password before saving to Firestore
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Prepare admin data for Firestore
  const adminData = {
    firstName: 'System',
    lastName: 'Admin',
    email: email,
    password: hashedPassword,
    authUid: authUser.uid,
    role: 'admin',
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create admin document in Firestore using the Auth UID as document ID
  const adminRef = db.collection('users').doc(authUser.uid);
  await adminRef.set(adminData);

  return { id: authUser.uid, ...adminData };
}

async function main() {
  const email = (process.argv[2] || 'admin@eduboost.local').toLowerCase().trim();
  const plain = process.argv[3] || 'Admin@1234';

  try {
    // Check if admin already exists in Firebase Auth
    let existingAuthUser;
    try {
      existingAuthUser = await auth.getUserByEmail(email);
      console.log(`⚠️  Admin already exists in Firebase Auth: ${email}`);
      
      // Check if Firestore document exists
      const firestoreDoc = await db.collection('users').doc(existingAuthUser.uid).get();
      if (!firestoreDoc.exists) {
        // Create missing Firestore document
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plain, salt);
        
        const adminData = {
          firstName: 'System',
          lastName: 'Admin',
          email: email,
          password: hashedPassword,
          authUid: existingAuthUser.uid,
          role: 'admin',
          isApproved: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await db.collection('users').doc(existingAuthUser.uid).set(adminData);
        console.log(`✅ Created missing Firestore document for admin: ${email}`);
      } else {
        console.log(`ℹ️  Admin already exists in both Auth and Firestore: ${email}`);
      }
    } catch (authError) {
      // Admin doesn't exist in Auth, create new one
      const newAdmin = await createAdminUser(email, plain);
      console.log(`✅ Admin created: ${email}`);
    }

    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${plain}`);
    console.log('🎯 Role: admin');
    console.log('✅ Status: approved');
    console.log('🔥 Created in both Firebase Auth and Firestore');
    
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});