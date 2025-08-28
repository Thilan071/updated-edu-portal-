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

// Session configuration for different modules
const moduleSessionConfig = {
  "Introduction to Computer Science": {
    totalSessions: 24,
    sessionDuration: 2, // hours per session
    sessionsPerWeek: 3,
    practicalSessions: 8,
    theorySessions: 16
  },
  "Mathematics for Computing": {
    totalSessions: 20,
    sessionDuration: 2,
    sessionsPerWeek: 2,
    practicalSessions: 6,
    theorySessions: 14
  },
  "Programming Fundamentals": {
    totalSessions: 30,
    sessionDuration: 2.5,
    sessionsPerWeek: 3,
    practicalSessions: 20,
    theorySessions: 10
  },
  "Web Development": {
    totalSessions: 28,
    sessionDuration: 2,
    sessionsPerWeek: 3,
    practicalSessions: 18,
    theorySessions: 10
  },
  "Database Management": {
    totalSessions: 22,
    sessionDuration: 2,
    sessionsPerWeek: 2,
    practicalSessions: 12,
    theorySessions: 10
  },
  "Object-Oriented Programming (OOP)": {
    totalSessions: 32,
    sessionDuration: 2.5,
    sessionsPerWeek: 3,
    practicalSessions: 22,
    theoryServices: 10
  },
  "Computer Networks": {
    totalSessions: 26,
    sessionDuration: 2,
    sessionsPerWeek: 2,
    practicalSessions: 10,
    theoryServices: 16
  },
  "Operating Systems": {
    totalSessions: 30,
    sessionDuration: 2,
    sessionsPerWeek: 3,
    practicalSessions: 15,
    theoryServices: 15
  },
  "Introduction to Machine Learning": {
    totalSessions: 28,
    sessionDuration: 2.5,
    sessionsPerWeek: 2,
    practicalSessions: 18,
    theoryServices: 10
  },
  "Electronics and Computer System Architecture": {
    totalSessions: 26,
    sessionDuration: 2,
    sessionsPerWeek: 2,
    practicalSessions: 12,
    theoryServices: 14
  }
};

async function updateModulesWithParticipation() {
  try {
    console.log('🔄 Updating modules with participation tracking...');

    // Get all existing modules
    const modulesSnapshot = await db.collection('modules').get();
    
    if (modulesSnapshot.empty) {
      console.log('❌ No modules found. Please run seed-cs-programs.mjs first.');
      return;
    }

    let updatedCount = 0;

    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleData = moduleDoc.data();
      const moduleTitle = moduleData.title || moduleData.name;
      
      // Get session config for this module
      const sessionConfig = moduleSessionConfig[moduleTitle] || {
        totalSessions: 24,
        sessionDuration: 2,
        sessionsPerWeek: 3,
        practicalSessions: 12,
        theoryServices: 12
      };

      // Calculate total hours
      const totalSessionHours = sessionConfig.totalSessions * sessionConfig.sessionDuration;

      // Update module with participation tracking fields
      const updateData = {
        // Session tracking
        sessionTracking: {
          totalSessions: sessionConfig.totalSessions,
          sessionDuration: sessionConfig.sessionDuration,
          sessionsPerWeek: sessionConfig.sessionsPerWeek,
          practicalSessions: sessionConfig.practicalSessions,
          theoryServices: sessionConfig.theoryServices || sessionConfig.theorySessions,
          totalSessionHours: totalSessionHours
        },
        
        // Participation settings
        participationSettings: {
          trackAttendance: true,
          minimumAttendancePercentage: 75,
          attendanceWeight: 10, // 10% of final grade
          participationWeight: 5, // 5% of final grade
          allowLateAttendance: true,
          lateAttendanceMinutes: 15
        },
        
        // Updated timestamp
        updatedAt: new Date(),
        
        // Add participation tracking flag
        hasParticipationTracking: true
      };

      await db.collection('modules').doc(moduleDoc.id).update(updateData);
      
      console.log(`✅ Updated module: ${moduleTitle}`);
      console.log(`   - Total Sessions: ${sessionConfig.totalSessions}`);
      console.log(`   - Session Duration: ${sessionConfig.sessionDuration} hours`);
      console.log(`   - Total Hours: ${totalSessionHours} hours`);
      
      updatedCount++;
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} modules with participation tracking!`);
    
  } catch (error) {
    console.error('❌ Error updating modules:', error);
  }
}

async function createParticipationCollection() {
  try {
    console.log('\n📊 Creating participation tracking collection...');

    // Get all students and modules for sample data
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
    const modulesSnapshot = await db.collection('modules').get();

    if (studentsSnapshot.empty || modulesSnapshot.empty) {
      console.log('❌ Need students and modules to create participation data.');
      return;
    }

    const students = studentsSnapshot.docs;
    const modules = modulesSnapshot.docs;

    console.log(`Found ${students.length} students and ${modules.length} modules`);

    let participationRecords = 0;

    // Create participation records for each student-module combination
    for (const studentDoc of students) {
      const studentData = studentDoc.data();
      
      // Get student's enrollments to see which modules they're enrolled in
      const enrollmentsSnapshot = await db.collection('users')
        .doc(studentDoc.id)
        .collection('enrollments')
        .get();

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollment = enrollmentDoc.data();
        
        // Get the program to find modules
        if (enrollment.courseId) {
          const programDoc = await db.collection('programs').doc(enrollment.courseId).get();
          
          if (programDoc.exists) {
            const programData = programDoc.data();
            
            if (programData.moduleIds && Array.isArray(programData.moduleIds)) {
              // Create participation tracking for each module in the program
              for (const moduleId of programData.moduleIds) {
                const moduleDoc = await db.collection('modules').doc(moduleId).get();
                
                if (moduleDoc.exists) {
                  const moduleData = moduleDoc.data();
                  const sessionConfig = moduleData.sessionTracking || { totalSessions: 24 };
                  
                  // Generate realistic attendance data
                  const attendanceRecords = [];
                  const totalSessions = sessionConfig.totalSessions || 24;
                  
                  for (let sessionNum = 1; sessionNum <= totalSessions; sessionNum++) {
                    // Random attendance with 80% probability of attending
                    const attended = Math.random() > 0.2;
                    const attendanceTime = attended ? new Date(Date.now() - (totalSessions - sessionNum) * 24 * 60 * 60 * 1000) : null;
                    
                    attendanceRecords.push({
                      sessionNumber: sessionNum,
                      attended: attended,
                      attendanceTime: attendanceTime,
                      lateMinutes: attended ? Math.floor(Math.random() * 10) : 0,
                      participationScore: attended ? Math.floor(Math.random() * 3) + 3 : 0 // 3-5 if attended, 0 if not
                    });
                  }
                  
                  // Calculate statistics
                  const attendedSessions = attendanceRecords.filter(r => r.attended).length;
                  const attendancePercentage = Math.round((attendedSessions / totalSessions) * 100);
                  const avgParticipationScore = attendanceRecords.reduce((sum, r) => sum + r.participationScore, 0) / totalSessions;
                  
                  // Create participation document
                  const participationData = {
                    studentId: studentDoc.id,
                    studentName: `${studentData.firstName} ${studentData.lastName}`,
                    studentEmail: studentData.email,
                    moduleId: moduleId,
                    moduleName: moduleData.title || moduleData.name,
                    enrollmentId: enrollmentDoc.id,
                    
                    // Session statistics
                    totalSessions: totalSessions,
                    attendedSessions: attendedSessions,
                    missedSessions: totalSessions - attendedSessions,
                    attendancePercentage: attendancePercentage,
                    
                    // Participation metrics
                    averageParticipationScore: Math.round(avgParticipationScore * 10) / 10,
                    totalParticipationPoints: Math.round(avgParticipationScore * totalSessions),
                    
                    // Detailed records
                    attendanceRecords: attendanceRecords,
                    
                    // Status and metadata
                    status: attendancePercentage >= 75 ? 'good' : attendancePercentage >= 50 ? 'warning' : 'critical',
                    lastUpdated: new Date(),
                    createdAt: new Date(),
                    
                    // Academic period info
                    academicYear: '2024-2025',
                    semester: moduleData.semester || 1
                  };
                  
                  await db.collection('participation').add(participationData);
                  participationRecords++;
                  
                  console.log(`📝 Created participation record: ${studentData.firstName} ${studentData.lastName} - ${moduleData.title}`);
                  console.log(`   Attendance: ${attendedSessions}/${totalSessions} (${attendancePercentage}%)`);
                }
              }
            }
          }
        }
      }
    }

    console.log(`\n🎉 Successfully created ${participationRecords} participation tracking records!`);
    
  } catch (error) {
    console.error('❌ Error creating participation collection:', error);
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting participation tracking setup...\n');
    
    // Step 1: Update modules with session hours and participation settings
    await updateModulesWithParticipation();
    
    // Step 2: Create participation tracking collection with sample data
    await createParticipationCollection();
    
    console.log('\n✅ Participation tracking setup completed successfully!');
    console.log('\nWhat was created:');
    console.log('📚 Updated all modules with session tracking and participation settings');
    console.log('👥 Created participation records for all enrolled students');
    console.log('📊 Generated realistic attendance and participation data');
    console.log('📈 Ready for analytics and reporting');
    
  } catch (error) {
    console.error('❌ Error in main execution:', error);
  } finally {
    process.exit(0);
  }
}

main();