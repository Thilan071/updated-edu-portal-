// scripts/seed-educator.mjs
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

async function createEducatorUser(email, password) {
  // Create Firebase Auth user first
  const authUser = await auth.createUser({
    email: email,
    password: password,
    displayName: 'Test Educator',
    disabled: false,
  });

  // Hash password before saving to Firestore
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Prepare educator data for Firestore
  const educatorData = {
    firstName: 'Test',
    lastName: 'Educator',
    email: email,
    password: hashedPassword,
    authUid: authUser.uid,
    role: 'educator',
    isApproved: true,
    specialization: 'Computer Science',
    department: 'Computer Science Department',
    experience: '5 years',
    qualification: 'Masters in Computer Science',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create educator document in Firestore using the Auth UID as document ID
  const educatorRef = db.collection('users').doc(authUser.uid);
  await educatorRef.set(educatorData);

  return { id: authUser.uid, ...educatorData };
}

async function main() {
  const email = (process.argv[2] || 'educator@eduboost.com').toLowerCase().trim();
  const password = process.argv[3] || 'Educator123!';

  try {
    // Check if educator already exists in Firebase Auth
    let existingAuthUser;
    try {
      existingAuthUser = await auth.getUserByEmail(email);
      console.log(`⚠️  Educator already exists in Firebase Auth: ${email}`);
      
      // Check if Firestore document exists
      const firestoreDoc = await db.collection('users').doc(existingAuthUser.uid).get();
      if (!firestoreDoc.exists) {
        // Create missing Firestore document
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const educatorData = {
          firstName: 'Test',
          lastName: 'Educator',
          email: email,
          password: hashedPassword,
          authUid: existingAuthUser.uid,
          role: 'educator',
          isApproved: true,
          specialization: 'Computer Science',
          department: 'Computer Science Department',
          experience: '5 years',
          qualification: 'Masters in Computer Science',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await db.collection('users').doc(existingAuthUser.uid).set(educatorData);
        console.log(`✅ Created missing Firestore document for educator: ${email}`);
      } else {
        console.log(`ℹ️  Educator already exists in both Auth and Firestore: ${email}`);
      }
    } catch (authError) {
      // Educator doesn't exist in Auth, create new one
      const newEducator = await createEducatorUser(email, password);
      console.log(`✅ Educator created: ${email}`);
    }

    console.log(`\n🎉 Educator setup completed!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('🎯 Role: educator');
    console.log('✅ Status: approved');
    console.log('🔥 Created in both Firebase Auth and Firestore');
    
  } catch (error) {
    console.error('❌ Error seeding educator:', error);
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
