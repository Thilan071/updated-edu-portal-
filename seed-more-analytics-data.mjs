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

async function addMoreAnalyticsData() {
  console.log('📊 Adding more analytics data for better visualization...\n');

  try {
    // Get all students and modules
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    const modulesSnapshot = await db.collection('modules').get();
    
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const modules = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`👥 Found ${students.length} students`);
    console.log(`📚 Found ${modules.length} modules`);

    // Add more progress records for different students and modules
    const progressRecords = [
      // Student 1 (existing user) - additional modules
      {
        studentId: students[0]?.id,
        moduleId: modules[1]?.id, // Different module
        marks: 85,
        status: 'completed',
        assessmentType: 'exam',
        maxScore: 100,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      },
      {
        studentId: students[0]?.id,
        moduleId: modules[2]?.id,
        marks: 45,
        status: 'in_progress',
        assessmentType: 'assignment',
        maxScore: 100,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      // Student 2 - multiple modules
      {
        studentId: students[1]?.id,
        moduleId: modules[0]?.id,
        marks: 78,
        status: 'completed',
        assessmentType: 'exam',
        maxScore: 100,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: students[1]?.id,
        moduleId: modules[1]?.id,
        marks: 92,
        status: 'completed',
        assessmentType: 'practical',
        maxScore: 100,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: students[1]?.id,
        moduleId: modules[3]?.id,
        marks: 55,
        status: 'completed',
        assessmentType: 'assignment',
        maxScore: 100,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      // Student 3 - some progress
      {
        studentId: students[2]?.id,
        moduleId: modules[0]?.id,
        marks: 65,
        status: 'completed',
        assessmentType: 'exam',
        maxScore: 100,
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: students[2]?.id,
        moduleId: modules[2]?.id,
        marks: 88,
        status: 'completed',
        assessmentType: 'practical',
        maxScore: 100,
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      },
      // Student 4 - mixed results
      {
        studentId: students[3]?.id,
        moduleId: modules[1]?.id,
        marks: 42,
        status: 'in_progress',
        assessmentType: 'assignment',
        maxScore: 100,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: students[3]?.id,
        moduleId: modules[4]?.id,
        marks: 73,
        status: 'completed',
        assessmentType: 'exam',
        maxScore: 100,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    // Add progress records
    for (const record of progressRecords) {
      if (record.studentId && record.moduleId) {
        await db.collection('student_progress').add(record);
        console.log(`✅ Added progress: Student ${record.studentId.substring(0, 8)}... in ${modules.find(m => m.id === record.moduleId)?.title || record.moduleId} - ${record.marks}%`);
      }
    }

    // Add more submissions
    const submissions = [
      {
        studentId: students[1]?.id,
        moduleId: modules[2]?.id,
        assignmentId: 'assignment_001',
        finalGrade: 87,
        isGraded: true,
        status: 'graded',
        submittedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: students[2]?.id,
        moduleId: modules[1]?.id,
        assignmentId: 'assignment_002',
        finalGrade: 94,
        isGraded: true,
        status: 'graded',
        submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        studentId: students[3]?.id,
        moduleId: modules[0]?.id,
        assignmentId: 'assignment_003',
        finalGrade: 56,
        isGraded: true,
        status: 'graded',
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        gradedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    // Add submissions
    for (const submission of submissions) {
      if (submission.studentId && submission.moduleId) {
        await db.collection('submissions').add(submission);
        console.log(`✅ Added submission: Student ${submission.studentId.substring(0, 8)}... in ${modules.find(m => m.id === submission.moduleId)?.title || submission.moduleId} - Grade: ${submission.finalGrade}%`);
      }
    }

    console.log('\n✅ Successfully added more analytics data!');
    console.log('📊 The assessment completion chart should now show more realistic data');

  } catch (error) {
    console.error('❌ Error adding analytics data:', error);
  }
}

addMoreAnalyticsData();
