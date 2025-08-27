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

// Dummy modules data
const modules = [
  {
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of HTML, CSS, and JavaScript to build modern web applications.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "beginner",
    estimatedHours: 40
  },
  {
    title: "Advanced JavaScript Programming",
    description: "Master advanced JavaScript concepts including ES6+, async programming, and modern frameworks.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "advanced",
    estimatedHours: 60
  },
  {
    title: "Database Design and Management",
    description: "Learn to design, implement, and manage relational and NoSQL databases effectively.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "intermediate",
    estimatedHours: 50
  },
  {
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile applications using React Native and modern development practices.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "intermediate",
    estimatedHours: 70
  },
  {
    title: "Cloud Computing Fundamentals",
    description: "Understand cloud services, deployment strategies, and infrastructure management.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "intermediate",
    estimatedHours: 45
  },
  {
    title: "Cybersecurity Essentials",
    description: "Learn essential cybersecurity principles, threat detection, and protection strategies.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "intermediate",
    estimatedHours: 55
  },
  {
    title: "Data Science and Analytics",
    description: "Master data analysis, visualization, and machine learning techniques using Python.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "advanced",
    estimatedHours: 80
  },
  {
    title: "UI/UX Design Principles",
    description: "Learn user interface and user experience design principles for creating intuitive applications.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "beginner",
    estimatedHours: 35
  },
  {
    title: "DevOps and CI/CD Pipelines",
    description: "Implement continuous integration and deployment practices for modern software development.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "advanced",
    estimatedHours: 65
  },
  {
    title: "Artificial Intelligence Fundamentals",
    description: "Introduction to AI concepts, machine learning algorithms, and practical applications.",
    createdBy: "educator@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
    difficulty: "advanced",
    estimatedHours: 75
  }
];

async function seedModules() {
  try {
    console.log('Starting to seed modules...');
    
    const batch = db.batch();
    
    modules.forEach((module, index) => {
      const docRef = db.collection('modules').doc();
      batch.set(docRef, module);
      console.log(`Added module ${index + 1}: ${module.title}`);
    });
    
    await batch.commit();
    console.log('\n✅ Successfully seeded 10 modules to Firestore!');
    console.log('\nModules added:');
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.title} (${module.difficulty})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding modules:', error);
  } finally {
    process.exit(0);
  }
}

seedModules();