import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

// Check for required environment variables
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error(
    'Missing Firebase Admin SDK credentials. Please check your .env.local file and ensure you have set:\n' +
    '- FIREBASE_PROJECT_ID\n' +
    '- FIREBASE_CLIENT_EMAIL\n' +
    '- FIREBASE_PRIVATE_KEY\n\n' +
    'See GET_SERVICE_ACCOUNT.md for detailed instructions.'
  );
}

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID,
};

// Initialize Firebase Admin (avoid multiple initialization)
const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];

const db = getFirestore(app);
const auth = getAuth(app);

// Test student data
const testStudent = {
  email: 'test.student@eduboost.com',
  password: 'TestStudent123!',
  firstName: 'Test',
  lastName: 'Student',
  role: 'student',
  studentId: 'STU2024001'
};

async function seedStudentEnrollments() {
  try {
    console.log('🚀 Starting student enrollment seeding...');
    
    // Step 1: Create test student user
    console.log('\n📝 Creating test student...');
    let studentUser;
    try {
      studentUser = await auth.createUser({
        email: testStudent.email,
        password: testStudent.password,
        displayName: `${testStudent.firstName} ${testStudent.lastName}`
      });
      console.log(`✅ Created student user: ${studentUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('📋 Student user already exists, fetching existing user...');
        studentUser = await auth.getUserByEmail(testStudent.email);
        console.log(`✅ Found existing student user: ${studentUser.uid}`);
      } else {
        throw error;
      }
    }
    
    // Step 2: Create student document in Firestore
    console.log('\n📄 Creating student document in Firestore...');
    const studentDocRef = db.collection('users').doc(studentUser.uid);
    await studentDocRef.set({
      firstName: testStudent.firstName,
      lastName: testStudent.lastName,
      email: testStudent.email,
      role: testStudent.role,
      studentId: testStudent.studentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }, { merge: true });
    console.log(`✅ Created/updated student document for: ${testStudent.email}`);
    
    // Step 3: Get available programs
    console.log('\n🎓 Fetching available programs...');
    const programsSnapshot = await db.collection('programs').where('isActive', '==', true).limit(1).get();
    
    if (programsSnapshot.empty) {
      console.log('❌ No active programs found. Please run seed-cs-programs.mjs first.');
      return;
    }
    
    const program = { id: programsSnapshot.docs[0].id, ...programsSnapshot.docs[0].data() };
    console.log(`✅ Found program: ${program.title}`);
    
    // Step 4: Get available batches for this program
    console.log('\n👥 Fetching available batches...');
    const batchesSnapshot = await db.collection('batches').where('programId', '==', program.id).limit(1).get();
    
    let batch = null;
    if (!batchesSnapshot.empty) {
      batch = { id: batchesSnapshot.docs[0].id, ...batchesSnapshot.docs[0].data() };
      console.log(`✅ Found batch: ${batch.name}`);
    } else {
      console.log('⚠️ No batches found for this program, enrolling without batch.');
    }
    
    // Step 5: Enroll student in the program
    console.log('\n📚 Enrolling student in program...');
    const enrollmentRef = db.collection('users').doc(studentUser.uid).collection('enrollments').doc();
    const enrollment = {
      courseId: program.id,
      batchId: batch?.id || null,
      enrolledAt: new Date(),
      status: 'active',
      id: enrollmentRef.id
    };
    
    await enrollmentRef.set(enrollment);
    console.log(`✅ Enrolled student in program: ${program.title}`);
    
    // Update user document with batch information if available
    if (batch) {
      await studentDocRef.update({
        currentBatchId: batch.id,
        currentBatchName: batch.name,
        currentBatchDetails: {
          id: batch.id,
          name: batch.name,
          academicYear: batch.academicYear || '',
          startDate: batch.startDate || null,
          endDate: batch.endDate || null,
          instructor: batch.instructor || ''
        },
        updatedAt: new Date()
      });
      console.log(`✅ Updated student with batch information: ${batch.name}`);
    }
    
    // Step 6: Get modules from the program and activate assignment templates
    console.log('\n📋 Processing assignment templates for modules...');
    
    if (program.moduleIds && program.moduleIds.length > 0) {
      // Get the first module to create active assignments
      const moduleId = program.moduleIds[0];
      const moduleDoc = await db.collection('modules').doc(moduleId).get();
      
      if (moduleDoc.exists) {
        const moduleData = moduleDoc.data();
        console.log(`✅ Processing module: ${moduleData.title}`);
        
        // Get assignment templates for this module
        const templatesSnapshot = await db.collection('assignment_templates')
          .where('moduleId', '==', moduleId)
          .get();
        
        if (!templatesSnapshot.empty) {
          console.log(`📝 Found ${templatesSnapshot.docs.length} assignment templates for module`);
          
          // Activate the first assignment template with a due date
          const templateDoc = templatesSnapshot.docs[0];
          const templateData = templateDoc.data();
          
          // Create an active assignment from the template
          const activeAssignmentRef = db.collection('assignments').doc();
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days
          
          const activeAssignment = {
            ...templateData,
            id: activeAssignmentRef.id,
            templateId: templateDoc.id,
            isActive: true,
            dueDate: dueDate,
            activatedAt: new Date(),
            activatedBy: 'admin@eduboost.com'
          };
          
          await activeAssignmentRef.set(activeAssignment);
          console.log(`✅ Created active assignment: ${activeAssignment.title}`);
          console.log(`   📅 Due date: ${dueDate.toDateString()}`);
        } else {
          console.log('⚠️ No assignment templates found for this module. Please run seed-assignment-templates.mjs first.');
        }
      }
    } else {
      console.log('⚠️ Program has no modules assigned.');
    }
    
    console.log('\n🎉 Student enrollment seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👤 Student created: ${testStudent.email}`);
    console.log(`   🎓 Enrolled in program: ${program.title}`);
    if (batch) {
      console.log(`   👥 Assigned to batch: ${batch.name}`);
    }
    console.log(`   📋 Active assignments created for testing`);
    console.log('\n🔐 Login credentials:');
    console.log(`   📧 Email: ${testStudent.email}`);
    console.log(`   🔑 Password: ${testStudent.password}`);
    
  } catch (error) {
    console.error('❌ Error seeding student enrollments:', error);
    throw error;
  }
}

// Run the seeding function
seedStudentEnrollments()
  .then(() => {
    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });