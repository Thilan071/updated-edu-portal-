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

// First, let's get existing modules to reference them in programs
async function getExistingModules() {
  try {
    const modulesSnapshot = await db.collection('modules').get();
    const modules = [];
    modulesSnapshot.forEach(doc => {
      modules.push({ id: doc.id, ...doc.data() });
    });
    return modules;
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
}

// Sample programs data
const programs = [
  {
    title: "Full Stack Web Development Bootcamp",
    description: "Comprehensive program covering frontend and backend development with modern technologies.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    duration: "6 months",
    level: "intermediate",
    moduleIds: [] // Will be populated with actual module IDs
  },
  {
    title: "Data Science & AI Specialization",
    description: "Advanced program focusing on data analysis, machine learning, and artificial intelligence.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    duration: "8 months",
    level: "advanced",
    moduleIds: [] // Will be populated with actual module IDs
  },
  {
    title: "Mobile App Development Track",
    description: "Learn to build cross-platform mobile applications using React Native and modern tools.",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    duration: "4 months",
    level: "intermediate",
    moduleIds: [] // Will be populated with actual module IDs
  }
];

// Sample batches data
const batches = [
  {
    name: "Web Dev Batch 2024-Q1",
    description: "First quarter batch for Full Stack Web Development Bootcamp",
    programId: "", // Will be populated with actual program ID
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-08-31'),
    maxStudents: 30,
    currentStudents: 0,
    status: "upcoming",
    instructor: "john.doe@eduboost.com",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Data Science Batch 2024-Spring",
    description: "Spring batch for Data Science & AI Specialization program",
    programId: "", // Will be populated with actual program ID
    startDate: new Date('2024-04-15'),
    endDate: new Date('2024-12-15'),
    maxStudents: 25,
    currentStudents: 0,
    status: "upcoming",
    instructor: "jane.smith@eduboost.com",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Mobile Dev Batch 2024-Summer",
    description: "Summer batch for Mobile App Development Track",
    programId: "", // Will be populated with actual program ID
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-09-30'),
    maxStudents: 20,
    currentStudents: 0,
    status: "upcoming",
    instructor: "mike.johnson@eduboost.com",
    createdBy: "admin@eduboost.com",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedProgramsAndBatches() {
  try {
    console.log('Starting to seed programs and batches...');
    
    // First, get existing modules
    const existingModules = await getExistingModules();
    console.log(`Found ${existingModules.length} existing modules`);
    
    if (existingModules.length === 0) {
      console.log('⚠️  No modules found. Please run seed-modules.mjs first.');
      return;
    }
    
    // Assign modules to programs based on their content
    const webDevModules = existingModules.filter(m => 
      m.title.toLowerCase().includes('web') || 
      m.title.toLowerCase().includes('javascript') ||
      m.title.toLowerCase().includes('database')
    ).map(m => m.id);
    
    const dataModules = existingModules.filter(m => 
      m.title.toLowerCase().includes('data') || 
      m.title.toLowerCase().includes('ai') ||
      m.title.toLowerCase().includes('artificial')
    ).map(m => m.id);
    
    const mobileModules = existingModules.filter(m => 
      m.title.toLowerCase().includes('mobile') || 
      m.title.toLowerCase().includes('react native') ||
      m.title.toLowerCase().includes('ui/ux')
    ).map(m => m.id);
    
    // Update programs with module IDs
    programs[0].moduleIds = webDevModules.slice(0, 4); // Web Dev program
    programs[1].moduleIds = dataModules.slice(0, 3); // Data Science program
    programs[2].moduleIds = mobileModules.slice(0, 3); // Mobile Dev program
    
    // Seed programs first
    console.log('\nSeeding programs...');
    const programBatch = db.batch();
    const programIds = [];
    
    programs.forEach((program, index) => {
      const docRef = db.collection('programs').doc();
      programBatch.set(docRef, program);
      programIds.push(docRef.id);
      console.log(`Added program ${index + 1}: ${program.title}`);
    });
    
    await programBatch.commit();
    console.log('✅ Programs seeded successfully!');
    
    // Update batches with program IDs
    batches[0].programId = programIds[0]; // Web Dev batch
    batches[1].programId = programIds[1]; // Data Science batch
    batches[2].programId = programIds[2]; // Mobile Dev batch
    
    // Seed batches
    console.log('\nSeeding batches...');
    const batchBatch = db.batch();
    
    batches.forEach((batch, index) => {
      const docRef = db.collection('batches').doc();
      batchBatch.set(docRef, batch);
      console.log(`Added batch ${index + 1}: ${batch.name}`);
    });
    
    await batchBatch.commit();
    console.log('✅ Batches seeded successfully!');
    
    console.log('\n🎉 Successfully seeded programs and batches to Firestore!');
    console.log('\nPrograms added:');
    programs.forEach((program, index) => {
      console.log(`${index + 1}. ${program.title} (${program.level}) - ${program.moduleIds.length} modules`);
    });
    
    console.log('\nBatches added:');
    batches.forEach((batch, index) => {
      console.log(`${index + 1}. ${batch.name} (${batch.status}) - Max: ${batch.maxStudents} students`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding programs and batches:', error);
  } finally {
    process.exit(0);
  }
}

seedProgramsAndBatches();