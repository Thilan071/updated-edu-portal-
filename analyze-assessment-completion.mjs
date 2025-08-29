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

async function analyzeAssessmentCompletion() {
  console.log('🔍 Analyzing Assessment Completion Data...\n');

  try {
    // Get all modules
    const modulesSnapshot = await db.collection('modules').get();
    const modules = {};
    modulesSnapshot.docs.forEach(doc => {
      modules[doc.id] = {
        id: doc.id,
        title: doc.data().title || doc.id,
        ...doc.data()
      };
    });
    
    console.log('📚 Available Modules:');
    Object.values(modules).forEach(module => {
      console.log(`  - ${module.title} (${module.id})`);
    });

    // Get all students
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();
    
    console.log(`\n👥 Total Students: ${studentsSnapshot.size}`);

    // Get all submissions
    const submissionsSnapshot = await db.collection('submissions').get();
    const submissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`\n📤 Total Submissions: ${submissions.length}`);
    submissions.forEach(submission => {
      console.log(`  - Student: ${submission.studentId}, Module: ${submission.moduleId}, Grade: ${submission.finalGrade}, Graded: ${submission.isGraded}`);
    });

    // Get all progress records
    const progressSnapshot = await db.collection('student_progress').get();
    const progressData = progressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`\n📊 Total Progress Records: ${progressData.length}`);
    progressData.forEach(progress => {
      console.log(`  - Student: ${progress.studentId}, Module: ${progress.moduleId}, Marks: ${progress.marks}, Status: ${progress.status}`);
    });

    // Analyze enrollments by module
    const moduleEnrollments = {};
    const moduleCompletions = {};

    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const enrollmentsSnapshot = await db.collection('users')
        .doc(studentId)
        .collection('enrollments')
        .get();

      enrollmentsSnapshot.docs.forEach(enrollmentDoc => {
        const enrollment = enrollmentDoc.data();
        if (enrollment.moduleIds && Array.isArray(enrollment.moduleIds)) {
          enrollment.moduleIds.forEach(moduleId => {
            if (!moduleEnrollments[moduleId]) {
              moduleEnrollments[moduleId] = new Set();
            }
            moduleEnrollments[moduleId].add(studentId);
          });
        }
      });
    }

    // Count completions from submissions
    submissions.forEach(submission => {
      if (submission.moduleId && submission.isGraded && submission.finalGrade >= 50) {
        if (!moduleCompletions[submission.moduleId]) {
          moduleCompletions[submission.moduleId] = new Set();
        }
        moduleCompletions[submission.moduleId].add(submission.studentId);
      }
    });

    // Count completions from progress
    progressData.forEach(progress => {
      if (progress.moduleId && (progress.status === 'completed' || (progress.marks && progress.marks >= 50))) {
        if (!moduleCompletions[progress.moduleId]) {
          moduleCompletions[progress.moduleId] = new Set();
        }
        moduleCompletions[progress.moduleId].add(progress.studentId);
      }
    });

    console.log('\n📈 Assessment Completion Analysis:');
    Object.keys(modules).forEach(moduleId => {
      const enrolledCount = moduleEnrollments[moduleId] ? moduleEnrollments[moduleId].size : 0;
      const completedCount = moduleCompletions[moduleId] ? moduleCompletions[moduleId].size : 0;
      const completionRate = enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0;

      if (enrolledCount > 0) {
        console.log(`  📚 ${modules[moduleId].title}:`);
        console.log(`     Enrolled: ${enrolledCount}, Completed: ${completedCount}, Rate: ${completionRate}%`);
      }
    });

    console.log('\n✅ Analysis complete!');

  } catch (error) {
    console.error('❌ Error analyzing data:', error);
  }
}

analyzeAssessmentCompletion();
