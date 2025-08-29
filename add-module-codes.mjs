import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });

// Initialize Firebase Admin
const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
const db = getFirestore(app);

async function addModuleCodes() {
  try {
    console.log('🔧 Adding module codes to existing modules...\n');

    // Define module codes mapping
    const moduleCodeMapping = {
      'Web Development': 'WEB101',
      'Computer Networks': 'NET201',
      'Object-Oriented Programming (OOP)': 'OOP102',
      'Electronics and Computer System Architecture': 'ELE301',
      'Programming Fundamentals': 'PRG101',
      'Introduction to Computer Science': 'CSC101',
      'Mathematics for Computing': 'MAT201',
      'Database Management': 'DB201',
      'Introduction to Machine Learning': 'ML301'
    };

    // Get all modules
    const modulesSnapshot = await db.collection('modules').get();
    
    console.log(`Found ${modulesSnapshot.size} modules to update:`);

    const batch = db.batch();
    let updateCount = 0;

    modulesSnapshot.docs.forEach(doc => {
      const moduleData = doc.data();
      const moduleTitle = moduleData.title || moduleData.name;
      
      if (moduleTitle && moduleCodeMapping[moduleTitle]) {
        const code = moduleCodeMapping[moduleTitle];
        console.log(`  - Updating "${moduleTitle}" with code: ${code}`);
        
        batch.update(doc.ref, {
          code: code,
          updatedAt: new Date()
        });
        updateCount++;
      } else {
        // Generate a generic code if no mapping found
        const genericCode = moduleTitle ? 
          moduleTitle.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() + '101' : 
          'MOD101';
        
        console.log(`  - Updating "${moduleTitle}" with generic code: ${genericCode}`);
        
        batch.update(doc.ref, {
          code: genericCode,
          updatedAt: new Date()
        });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✅ Successfully updated ${updateCount} modules with codes!`);
    } else {
      console.log('\n💡 No modules needed updating.');
    }

    // Display updated modules
    console.log('\n📋 Updated modules:');
    const updatedSnapshot = await db.collection('modules').get();
    updatedSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.code || 'NO_CODE'}: ${data.title || data.name}`);
    });

  } catch (error) {
    console.error('❌ Error adding module codes:', error);
  }
}

addModuleCodes();
