import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

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

async function checkAnalyticsData() {
  console.log('🔍 Checking Firebase data for analytics...\n');

  // Check students
  const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
  console.log(`👥 Students: ${studentsSnapshot.size}`);

  // Check modules
  const modulesSnapshot = await db.collection('modules').get();
  console.log(`📚 Modules: ${modulesSnapshot.size}`);

  // Check assessments
  const assessmentsSnapshot = await db.collection('assessments').get();
  console.log(`📝 Assessments: ${assessmentsSnapshot.size}`);

  // Check student progress
  const progressSnapshot = await db.collection('student_progress').get();
  console.log(`📊 Student Progress Records: ${progressSnapshot.size}`);

  // Check submissions
  const submissionsSnapshot = await db.collection('submissions').get();
  console.log(`📤 Submissions: ${submissionsSnapshot.size}`);

  // Check enrollments
  let totalEnrollments = 0;
  for (const studentDoc of studentsSnapshot.docs) {
    const enrollmentsSnapshot = await db.collection('users').doc(studentDoc.id).collection('enrollments').get();
    totalEnrollments += enrollmentsSnapshot.size;
  }
  console.log(`🎓 Total Enrollments: ${totalEnrollments}`);

  console.log('\n📋 Sample Data:');
  
  if (progressSnapshot.size > 0) {
    console.log('\n📊 Sample Progress Records:');
    progressSnapshot.docs.slice(0, 3).forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Student: ${data.studentId}, Module: ${data.moduleId}, Marks: ${data.marks}, Status: ${data.status}`);
    });
  }

  if (studentsSnapshot.size > 0) {
    console.log('\n👥 Sample Students:');
    studentsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.firstName} ${data.lastName} (${data.email})`);
    });
  }

  return {
    students: studentsSnapshot.size,
    modules: modulesSnapshot.size,
    assessments: assessmentsSnapshot.size,
    progress: progressSnapshot.size,
    submissions: submissionsSnapshot.size,
    enrollments: totalEnrollments
  };
}

async function seedAnalyticsData() {
  console.log('\n🌱 Seeding sample analytics data...');

  // Get students and modules
  const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
  const modulesSnapshot = await db.collection('modules').get();

  if (studentsSnapshot.empty || modulesSnapshot.empty) {
    console.log('❌ Need students and modules to seed data. Please run other seed scripts first.');
    return;
  }

  const students = studentsSnapshot.docs;
  const modules = modulesSnapshot.docs;

  // Create sample progress data spanning 5 months
  const progressData = [];
  const now = new Date();
  
  for (let monthsBack = 4; monthsBack >= 0; monthsBack--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, Math.floor(Math.random() * 28) + 1);
    
    for (const student of students) {
      for (const module of modules) {
        // Random chance to have progress this month
        if (Math.random() > 0.3) {
          const marks = Math.floor(Math.random() * 40) + 50; // 50-90 marks
          const status = marks >= 50 ? 'completed' : 'failed';
          
          progressData.push({
            studentId: student.id,
            moduleId: module.id,
            moduleTitle: module.data().title || module.data().name,
            marks: marks,
            status: status,
            createdAt: monthDate,
            updatedAt: monthDate
          });
        }
      }
    }
  }

  // Add progress records
  console.log(`Adding ${progressData.length} progress records...`);
  const batch = db.batch();
  
  for (const progress of progressData) {
    const docRef = db.collection('student_progress').doc();
    batch.set(docRef, progress);
  }
  
  await batch.commit();
  console.log('✅ Sample analytics data seeded successfully!');
}

// Main execution
async function main() {
  try {
    const stats = await checkAnalyticsData();
    
    console.log('\n💡 Recommendations:');
    
    if (stats.students === 0) {
      console.log('- Run seed-student-enrollments.mjs to create students');
    }
    
    if (stats.modules === 0) {
      console.log('- Run seed-cs-programs.mjs to create modules');
    }
    
    if (stats.progress === 0) {
      console.log('- Run this script with --seed flag to create sample progress data');
      console.log('  node scripts/check-analytics-data.mjs --seed');
    }
    
    if (stats.assessments === 0) {
      console.log('- Create assessments through the educator interface');
    }

    // Check if --seed flag is provided
    if (process.argv.includes('--seed')) {
      await seedAnalyticsData();
    } else if (stats.progress === 0) {
      console.log('\n🔄 To seed sample analytics data, run:');
      console.log('node scripts/check-analytics-data.mjs --seed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();