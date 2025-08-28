// scripts/enroll-test-students.mjs
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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

async function enrollStudentInBatch() {
  try {
    console.log('🚀 Starting student batch enrollment...');

    // Get the existing test student
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'test.student@eduboost.com')
      .where('role', '==', 'student')
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ No test student found');
      return;
    }

    const studentDoc = usersSnapshot.docs[0];
    const studentId = studentDoc.id;
    const studentData = studentDoc.data();

    console.log(`✅ Found student: ${studentData.email} (ID: ${studentId})`);

    // Get available batches
    const batchesSnapshot = await db.collection('batches').get();
    if (batchesSnapshot.empty) {
      console.log('❌ No batches found');
      return;
    }

    const batch = batchesSnapshot.docs[0];
    const batchId = batch.id;
    const batchData = batch.data();

    console.log(`✅ Found batch: ${batchData.name} (ID: ${batchId})`);

    // Create enrollment document
    const enrollmentData = {
      studentId: studentId,
      studentEmail: studentData.email,
      studentName: `${studentData.firstName} ${studentData.lastName}`,
      batchId: batchId,
      batchName: batchData.name,
      programId: batchData.programId,
      enrollmentDate: new Date(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if enrollment already exists
    const existingEnrollment = await db.collection('enrollments')
      .where('studentId', '==', studentId)
      .where('batchId', '==', batchId)
      .get();

    if (!existingEnrollment.empty) {
      console.log('ℹ️  Student already enrolled in this batch');
      return;
    }

    // Create the enrollment
    const enrollmentRef = await db.collection('enrollments').add(enrollmentData);
    
    console.log(`✅ Enrolled student in batch: ${enrollmentRef.id}`);
    console.log('\n📊 Summary:');
    console.log(`   👤 Student: ${studentData.email}`);
    console.log(`   🎓 Batch: ${batchData.name}`);
    console.log(`   📅 Status: active`);
    console.log('\n🎉 Enrollment completed successfully!');

  } catch (error) {
    console.error('❌ Error enrolling student:', error);
  }
}

enrollStudentInBatch();
