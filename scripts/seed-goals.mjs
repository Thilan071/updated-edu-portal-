// scripts/seed-goals.mjs
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Check if required environment variables are set
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Missing Firebase Admin SDK credentials. Please check your .env.local file.');
  process.exit(1);
}

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};

// Initialize Firebase Admin
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
} catch (error) {
  console.error('❌ Error initializing Firebase Admin:', error.message);
  process.exit(1);
}

const db = getFirestore(app);

// Sample goals data
const sampleGoals = [
  { goal: 'Complete Module 1: Introduction to Programming', completed: false },
  { goal: 'Practice coding exercises daily for 30 minutes', completed: true },
  { goal: 'Build a personal portfolio website', completed: false },
  { goal: 'Learn React fundamentals and hooks', completed: false },
  { goal: 'Complete final project by end of semester', completed: false },
  { goal: 'Master JavaScript ES6+ features', completed: true },
  { goal: 'Understand database design principles', completed: false },
  { goal: 'Deploy first web application', completed: false }
];

async function addGoalsToUser(userId) {
  try {
    console.log(`📝 Adding goals to user: ${userId}`);
    
    const goalsRef = db.collection('users').doc(userId).collection('goals');
    const addedGoals = [];
    
    for (const goalData of sampleGoals) {
      const newGoal = {
        ...goalData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      const docRef = await goalsRef.add(newGoal);
      addedGoals.push({
        id: docRef.id,
        ...goalData
      });
      
      console.log(`  ✅ Added goal: "${goalData.goal}"`);
    }
    
    return addedGoals;
  } catch (error) {
    console.error(`❌ Error adding goals to user ${userId}:`, error);
    throw error;
  }
}

async function findTestUser() {
  try {
    // Look for any user in the users collection
    const usersSnapshot = await db.collection('users').limit(1).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in the database. Please create a user first.');
      return null;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`👤 Found user: ${userData.email} (${userData.role})`);
    return userDoc.id;
  } catch (error) {
    console.error('❌ Error finding test user:', error);
    return null;
  }
}

async function clearExistingGoals(userId) {
  try {
    console.log(`🧹 Clearing existing goals for user: ${userId}`);
    
    const goalsRef = db.collection('users').doc(userId).collection('goals');
    const snapshot = await goalsRef.get();
    
    if (snapshot.empty) {
      console.log('  ℹ️  No existing goals to clear.');
      return;
    }
    
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`  ✅ Cleared ${snapshot.size} existing goals.`);
  } catch (error) {
    console.error('❌ Error clearing existing goals:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting goals seeding process...');
    
    // Find a test user
    const userId = await findTestUser();
    if (!userId) {
      console.log('❌ Cannot proceed without a user. Please run the admin seeding script first.');
      process.exit(1);
    }
    
    // Clear existing goals (optional)
    const shouldClear = process.argv.includes('--clear');
    if (shouldClear) {
      await clearExistingGoals(userId);
    }
    
    // Add sample goals
    const addedGoals = await addGoalsToUser(userId);
    
    console.log('\n🎉 Goals seeding completed successfully!');
    console.log(`📊 Added ${addedGoals.length} goals to user ${userId}`);
    console.log('\n📋 Summary:');
    addedGoals.forEach((goal, index) => {
      const status = goal.completed ? '✅' : '⏳';
      console.log(`  ${index + 1}. ${status} ${goal.goal}`);
    });
    
    console.log('\n💡 You can now visit the goals page to see these goals!');
    console.log('🔗 URL: http://localhost:3000/dashboard/student/goals');
    
  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log('\n📖 Goals Seeding Script Usage:');
  console.log('  npm run seed-goals          # Add goals to first user found');
  console.log('  npm run seed-goals -- --clear  # Clear existing goals first');
  console.log('  npm run seed-goals -- --help   # Show this help');
  process.exit(0);
}

main();