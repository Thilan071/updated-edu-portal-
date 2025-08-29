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

async function debugEducatorData() {
  try {
    console.log('🔍 Debugging educator data in Firebase...\n');

    // Get all educators
    const educatorsSnapshot = await db.collection('users')
      .where('role', '==', 'educator')
      .get();

    console.log(`👨‍🏫 Total Educators: ${educatorsSnapshot.size}`);

    for (const educatorDoc of educatorsSnapshot.docs) {
      const educator = educatorDoc.data();
      console.log(`\n📋 Educator: ${educator.firstName} ${educator.lastName} (${educator.email})`);
      console.log(`   ID: ${educatorDoc.id}`);

      // Check assigned modules
      const modulesSnapshot = await db.collection('users')
        .doc(educatorDoc.id)
        .collection('modules')
        .get();

      console.log(`   📚 Assigned Modules: ${modulesSnapshot.size}`);
      
      const moduleIds = [];
      modulesSnapshot.docs.forEach(moduleDoc => {
        const moduleData = moduleDoc.data();
        moduleIds.push(moduleData.moduleId);
        console.log(`      - Module ID: ${moduleData.moduleId}`);
      });

      // Get actual module details
      if (moduleIds.length > 0) {
        for (const moduleId of moduleIds) {
          const moduleDoc = await db.collection('modules').doc(moduleId).get();
          if (moduleDoc.exists) {
            const module = moduleDoc.data();
            console.log(`      - Module: ${module.title || module.name} (${module.code || 'No code'})`);
          }
        }
      }

      // Check students enrolled in educator's modules
      if (moduleIds.length > 0) {
        const progressSnapshot = await db.collection('student_progress')
          .where('moduleId', 'in', moduleIds)
          .get();

        const uniqueStudents = new Set();
        progressSnapshot.docs.forEach(doc => {
          uniqueStudents.add(doc.data().studentId);
        });

        console.log(`   👥 Students in educator's modules: ${uniqueStudents.size}`);
      }

      // Check assessments created by educator
      const assessmentsSnapshot = await db.collection('assessments')
        .where('educatorId', '==', educatorDoc.id)
        .get();

      console.log(`   📝 Assessments created: ${assessmentsSnapshot.size}`);
    }

    // Check general analytics data
    console.log('\n📊 General Analytics:');
    
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();
    console.log(`   👥 Total Students: ${studentsSnapshot.size}`);

    const modulesSnapshot = await db.collection('modules').get();
    console.log(`   📚 Total Modules: ${modulesSnapshot.size}`);

    const progressSnapshot = await db.collection('student_progress').get();
    console.log(`   📊 Total Progress Records: ${progressSnapshot.size}`);

    const assessmentsSnapshot = await db.collection('assessments').get();
    console.log(`   📝 Total Assessments: ${assessmentsSnapshot.size}`);

  } catch (error) {
    console.error('❌ Error debugging educator data:', error);
  }
}

debugEducatorData();
