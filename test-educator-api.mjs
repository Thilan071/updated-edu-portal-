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

async function testEducatorAPI() {
  try {
    // Get first educator with modules assigned
    const educatorsSnapshot = await db.collection('users')
      .where('role', '==', 'educator')
      .get();

    let testEducatorId = null;
    let testEducator = null;

    for (const educatorDoc of educatorsSnapshot.docs) {
      const modulesSnapshot = await db.collection('users')
        .doc(educatorDoc.id)
        .collection('modules')
        .get();

      if (modulesSnapshot.size > 0) {
        testEducatorId = educatorDoc.id;
        testEducator = educatorDoc.data();
        break;
      }
    }

    if (!testEducatorId) {
      console.log('❌ No educator with assigned modules found');
      return;
    }

    console.log(`🧪 Testing API for educator: ${testEducator.firstName} ${testEducator.lastName} (${testEducatorId})`);

    // Test 1: Get educator modules
    console.log('\n📚 Testing modules API...');
    const modulesSnapshot = await db.collection('users')
      .doc(testEducatorId)
      .collection('modules')
      .get();
    
    const assignedModuleIds = modulesSnapshot.docs.map(doc => doc.data().moduleId);
    console.log(`   Found ${assignedModuleIds.length} assigned modules`);

    const modules = [];
    if (assignedModuleIds.length > 0) {
      const modulesSnapshot = await db.collection('modules')
        .where('__name__', 'in', assignedModuleIds)
        .get();
      
      modules.push(...modulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    }
    console.log(`   Module details retrieved: ${modules.length}`);
    console.log(`   Sample modules:`, modules.slice(0, 2).map(m => ({ id: m.id, title: m.title || m.name, code: m.code })));

    // Test 2: Get students in educator's modules
    console.log('\n👥 Testing students API...');
    
    // Get all programs that contain these modules
    const programsSnapshot = await db.collection('programs')
      .where('moduleIds', 'array-contains-any', assignedModuleIds)
      .get();
    
    const programIds = programsSnapshot.docs.map(doc => doc.id);
    console.log(`   Found ${programIds.length} programs containing educator's modules`);

    // Get students enrolled in these programs
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();

    const enrolledStudents = [];
    
    for (const studentDoc of studentsSnapshot.docs) {
      const studentId = studentDoc.id;
      const studentData = studentDoc.data();
      
      // Check if student has enrollments in any of the programs
      const enrollmentsSnapshot = await db.collection('users')
        .doc(studentId)
        .collection('enrollments')
        .where('courseId', 'in', programIds.length > 0 ? programIds : ['dummy'])
        .get();
      
      if (!enrollmentsSnapshot.empty) {
        // Get student's progress for educator's modules
        const progressSnapshot = await db.collection('student_progress')
          .where('studentId', '==', studentId)
          .where('moduleId', 'in', assignedModuleIds)
          .get();
        
        const moduleProgress = progressSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        enrolledStudents.push({
          id: studentId,
          firstName: studentData.firstName || '',
          lastName: studentData.lastName || '',
          email: studentData.email || '',
          moduleProgress,
          totalModules: assignedModuleIds.length,
          completedModules: moduleProgress.filter(p => p.status === 'completed').length
        });
      }
    }

    console.log(`   Found ${enrolledStudents.length} students enrolled in educator's modules`);
    console.log(`   Sample students:`, enrolledStudents.slice(0, 2).map(s => ({ 
      name: `${s.firstName} ${s.lastName}`, 
      email: s.email,
      completedModules: s.completedModules,
      totalModules: s.totalModules
    })));

    // Test 3: Get assessments
    console.log('\n📝 Testing assessments API...');
    const assessmentsSnapshot = await db.collection('assessments')
      .where('educatorId', '==', testEducatorId)
      .get();

    console.log(`   Found ${assessmentsSnapshot.size} assessments created by educator`);

    const assessments = [];
    for (const assessmentDoc of assessmentsSnapshot.docs) {
      const assessmentData = assessmentDoc.data();
      
      // Get student submissions for this assessment
      const submissionsSnapshot = await db.collection('student_progress')
        .where('assessmentId', '==', assessmentDoc.id)
        .get();
      
      const submissions = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const totalSubmissions = submissions.length;
      const pendingSubmissions = submissions.filter(s => s.status === 'pending' || !s.status).length;
      const completedSubmissions = submissions.filter(s => s.status === 'completed').length;
      
      assessments.push({
        id: assessmentDoc.id,
        ...assessmentData,
        stats: {
          totalSubmissions,
          pendingSubmissions,
          completedSubmissions
        }
      });
    }

    console.log(`   Assessment details retrieved: ${assessments.length}`);
    if (assessments.length > 0) {
      console.log(`   Sample assessment:`, {
        id: assessments[0].id,
        title: assessments[0].title,
        stats: assessments[0].stats
      });
    }

    // Summary for dashboard
    console.log('\n📊 Dashboard Summary:');
    console.log(`   - Total Students: ${enrolledStudents.length}`);
    console.log(`   - Active Modules: ${modules.filter(m => m.isActive !== false).length}`);
    console.log(`   - Pending Submissions: ${assessments.reduce((acc, a) => acc + a.stats.pendingSubmissions, 0)}`);
    console.log(`   - Assessments Created: ${assessments.length}`);

    // Performance data for chart
    console.log('\n📈 Performance Chart Data:');
    const modulePerformance = modules.slice(0, 4).map(module => {
      const moduleStudents = enrolledStudents.filter(student => 
        student.moduleProgress.some(progress => progress.moduleId === module.id)
      );
      const completedCount = moduleStudents.filter(student => 
        student.moduleProgress.some(progress => 
          progress.moduleId === module.id && progress.status === 'completed'
        )
      ).length;
      const atRiskCount = moduleStudents.filter(student => 
        student.moduleProgress.some(progress => 
          progress.moduleId === module.id && (progress.marks || 0) < 50
        )
      ).length;
      
      return {
        code: module.code || module.title?.substring(0, 6) || module.name?.substring(0, 6) || 'Module',
        atRisk: atRiskCount,
        topPerformers: completedCount
      };
    });

    console.log('   Chart data:', modulePerformance);

  } catch (error) {
    console.error('❌ Error testing educator API:', error);
  }
}

testEducatorAPI();
