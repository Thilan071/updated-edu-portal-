import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

// Check if required environment variables are set
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

// Computer Science modules data
const modules = [
  // First Semester - Easy/Foundational Modules
  {
    title: "Introduction to Computer Science",
    description: "Fundamental concepts of computer science including problem-solving, algorithms, and computational thinking.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "beginner",
    estimatedHours: 45,
    semester: 1
  },
  {
    title: "Mathematics for Computing",
    description: "Essential mathematical concepts for computer science including discrete mathematics, logic, and statistics.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "beginner",
    estimatedHours: 50,
    semester: 1
  },
  {
    title: "Programming Fundamentals",
    description: "Basic programming concepts, syntax, and problem-solving using a high-level programming language.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "beginner",
    estimatedHours: 60,
    semester: 1
  },
  {
    title: "Web Development",
    description: "Introduction to web technologies including HTML, CSS, JavaScript, and basic web application development.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "beginner",
    estimatedHours: 55,
    semester: 1
  },
  {
    title: "Database Management",
    description: "Fundamentals of database design, SQL, and database management systems for beginners.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "beginner",
    estimatedHours: 40,
    semester: 1
  },
  
  // Second Semester - Advanced Modules
  {
    title: "Object-Oriented Programming (OOP)",
    description: "Advanced programming concepts including classes, objects, inheritance, polymorphism, and design patterns.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "intermediate",
    estimatedHours: 65,
    semester: 2
  },
  {
    title: "Computer Networks",
    description: "Network protocols, architecture, security, and distributed systems concepts.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "intermediate",
    estimatedHours: 70,
    semester: 2
  },
  {
    title: "Operating Systems",
    description: "Operating system concepts including process management, memory management, and file systems.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "intermediate",
    estimatedHours: 75,
    semester: 2
  },
  {
    title: "Introduction to Machine Learning",
    description: "Fundamentals of machine learning algorithms, data preprocessing, and model evaluation.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "advanced",
    estimatedHours: 80,
    semester: 2
  },
  {
    title: "Electronics and Computer System Architecture",
    description: "Computer hardware, digital logic, processor architecture, and system design principles.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "intermediate",
    estimatedHours: 70,
    semester: 2
  }
];

// Programs data
const programs = [
  {
    title: "Computer Science Fundamentals (1st Semester)",
    description: "Foundation program covering essential computer science concepts and basic programming skills for beginners.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    duration: "6 months",
    level: "beginner",
    semester: 1,
    moduleIds: [] // Will be populated with 1st semester module IDs
  },
  {
    title: "Advanced Computer Science (2nd Semester)",
    description: "Advanced program focusing on complex computer science topics including systems, networks, and emerging technologies.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    duration: "6 months",
    level: "intermediate",
    semester: 2,
    moduleIds: [] // Will be populated with 2nd semester module IDs
  }
];

// Batches data
const batches = [
  {
    name: "EDU Boost 2024 C2",
    description: "Computer Science program batch for 2024 Cohort 2",
    programId: "", // Will be populated with actual program ID
    startDate: new Date('2024-08-01'),
    endDate: new Date('2025-07-31'),
    maxStudents: 35,
    currentStudents: 0,
    status: "upcoming",
    instructor: "cs.instructor@eduboost.com",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    cohort: "2024 C2"
  },
  {
    name: "EDU Boost 2025 C1",
    description: "Computer Science program batch for 2025 Cohort 1",
    programId: "", // Will be populated with actual program ID
    startDate: new Date('2025-02-01'),
    endDate: new Date('2026-01-31'),
    maxStudents: 40,
    currentStudents: 0,
    status: "upcoming",
    instructor: "cs.instructor@eduboost.com",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    cohort: "2025 C1"
  }
];

async function seedCSProgramsAndBatches() {
  try {
    console.log('🚀 Starting Computer Science programs and batches seeding...');

    // Step 1: Add modules
    console.log('📚 Adding Computer Science modules...');
    const moduleIds = { semester1: [], semester2: [] };
    
    for (const module of modules) {
      const moduleRef = await db.collection('modules').add(module);
      console.log(`✅ Added module: ${module.title} (ID: ${moduleRef.id})`);
      
      if (module.semester === 1) {
        moduleIds.semester1.push(moduleRef.id);
      } else {
        moduleIds.semester2.push(moduleRef.id);
      }
    }

    // Step 2: Add programs with module references
    console.log('🎓 Adding Computer Science programs...');
    const programIds = [];
    
    for (const program of programs) {
      // Assign appropriate module IDs based on semester
      if (program.semester === 1) {
        program.moduleIds = moduleIds.semester1;
      } else {
        program.moduleIds = moduleIds.semester2;
      }
      
      const programRef = await db.collection('programs').add(program);
      programIds.push(programRef.id);
      console.log(`✅ Added program: ${program.title} (ID: ${programRef.id})`);
      console.log(`   📋 Modules assigned: ${program.moduleIds.length}`);
    }

    // Step 3: Add batches with program references
    console.log('👥 Adding Computer Science batches...');
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      // Assign program ID (both batches can use either program, but let's assign them systematically)
      batch.programId = programIds[0]; // Both batches start with 1st semester program
      
      const batchRef = await db.collection('batches').add(batch);
      console.log(`✅ Added batch: ${batch.name} (ID: ${batchRef.id})`);
      console.log(`   🎯 Program ID: ${batch.programId}`);
      console.log(`   📅 Duration: ${batch.startDate.toDateString()} - ${batch.endDate.toDateString()}`);
    }

    console.log('\n🎉 Computer Science programs and batches seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   📚 Modules added: ${modules.length}`);
    console.log(`   🎓 Programs added: ${programs.length}`);
    console.log(`   👥 Batches added: ${batches.length}`);
    console.log('\n📋 Program Structure:');
    console.log(`   🥇 1st Semester (Fundamentals): ${moduleIds.semester1.length} modules`);
    console.log(`   🥈 2nd Semester (Advanced): ${moduleIds.semester2.length} modules`);
    console.log('\n👥 Batches Created:');
    console.log('   📅 EDU Boost 2024 C2: Aug 2024 - Jul 2025');
    console.log('   📅 EDU Boost 2025 C1: Feb 2025 - Jan 2026');
    
  } catch (error) {
    console.error('❌ Error seeding Computer Science programs and batches:', error);
    throw error;
  }
}

seedCSProgramsAndBatches();