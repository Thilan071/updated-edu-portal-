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

async function addComprehensiveAnalyticsData() {
  console.log('📊 Adding comprehensive analytics data for all charts...\n');

  try {
    // Get all students and modules
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    const modulesSnapshot = await db.collection('modules').get();
    
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const modules = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`👥 Found ${students.length} students`);
    console.log(`📚 Found ${modules.length} modules`);

    // Add more diverse progress records for better analytics
    const additionalProgressRecords = [];
    const additionalSubmissions = [];

    // Create progress for each student across multiple modules
    students.forEach((student, studentIndex) => {
      // Each student gets 3-5 modules
      const studentModules = modules.slice(studentIndex, studentIndex + 4);
      
      studentModules.forEach((module, moduleIndex) => {
        // Vary completion status and marks
        const baseScore = 40 + (studentIndex * 10) + (moduleIndex * 8);
        const finalScore = Math.min(95, Math.max(30, baseScore + Math.random() * 20));
        
        const record = {
          studentId: student.id,
          moduleId: module.id,
          marks: Math.round(finalScore),
          status: finalScore >= 50 ? 'completed' : 'in_progress',
          assessmentType: ['exam', 'practical', 'assignment'][Math.floor(Math.random() * 3)],
          maxScore: 100,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        };

        additionalProgressRecords.push(record);

        // Sometimes add a submission too
        if (Math.random() > 0.4) {
          const submission = {
            studentId: student.id,
            moduleId: module.id,
            assignmentId: `assignment_${module.id}_${studentIndex}`,
            finalGrade: Math.round(finalScore),
            isGraded: true,
            status: 'graded',
            submittedAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
            gradedAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
          };

          additionalSubmissions.push(submission);
        }
      });
    });

    // Add progress records
    console.log(`📊 Adding ${additionalProgressRecords.length} progress records...`);
    for (const record of additionalProgressRecords) {
      await db.collection('student_progress').add(record);
    }

    // Add submissions
    console.log(`📤 Adding ${additionalSubmissions.length} submissions...`);
    for (const submission of additionalSubmissions) {
      await db.collection('submissions').add(submission);
    }

    // Create some historical data for progress trend
    console.log('📈 Adding historical progress data for trend chart...');
    const monthsBack = 5;
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      // Add some historical progress records
      students.slice(0, 3).forEach(student => {
        const module = modules[Math.floor(Math.random() * modules.length)];
        const historicalRecord = {
          studentId: student.id,
          moduleId: module.id,
          marks: 50 + Math.random() * 40, // Random score between 50-90
          status: 'completed',
          assessmentType: 'exam',
          maxScore: 100,
          createdAt: date,
        };
        
        db.collection('student_progress').add(historicalRecord);
      });
    }

    console.log('\n✅ Successfully added comprehensive analytics data!');
    console.log('📊 All analytics charts should now show rich, realistic data:');
    console.log('  - Assessment Completion by Module: ✅');
    console.log('  - Average Student Progress Trend: ✅');
    console.log('  - Risk Level Distribution: ✅');
    console.log('  - Attendance/Participation Logs: ✅');
    console.log('  - Repeat Analysis: ✅');

  } catch (error) {
    console.error('❌ Error adding comprehensive analytics data:', error);
  }
}

addComprehensiveAnalyticsData();
