import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

// Assignment template data for each module
const assignmentTemplates = {
  // For each module, create one assignment and one written exam
  templates: [
    {
      title: "Project Assignment",
      description: "Complete a hands-on project to demonstrate your understanding of the module concepts.",
      type: "assignment",
      maxScore: 100,
      instructions: "Create a comprehensive project that showcases the key concepts learned in this module. Include documentation and code comments.",
      createdBy: "admin@eduboost.com"
    },
    {
      title: "Written Examination",
      description: "Comprehensive written exam covering all module topics and concepts.",
      type: "exam",
      maxScore: 100,
      instructions: "Answer all questions thoroughly. Show your work and explain your reasoning where applicable.",
      createdBy: "admin@eduboost.com"
    }
  ]
};

async function seedAssignmentTemplates() {
  try {
    console.log('Starting to seed assignment templates...');
    
    // Get all modules
    const modulesSnapshot = await db.collection('modules').get();
    const modules = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`Found ${modules.length} modules`);
    
    let totalTemplatesCreated = 0;
    
    for (const module of modules) {
      console.log(`\nProcessing module: ${module.title}`);
      
      // Check if templates already exist for this module
      const existingTemplatesSnapshot = await db.collection('modules')
        .doc(module.id)
        .collection('assignment_templates')
        .get();
      
      if (existingTemplatesSnapshot.docs.length > 0) {
        console.log(`  - Skipping (${existingTemplatesSnapshot.docs.length} templates already exist)`);
        continue;
      }
      
      // Create assignment templates for this module
      const batch = db.batch();
      
      for (const template of assignmentTemplates.templates) {
        const templateRef = db.collection('modules')
          .doc(module.id)
          .collection('assignment_templates')
          .doc();
        
        const assignmentData = {
          ...template,
          id: templateRef.id,
          moduleId: module.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: false,
          activatedAt: null,
          dueDate: null
        };
        
        batch.set(templateRef, assignmentData);
        totalTemplatesCreated++;
        
        console.log(`  - Created template: ${template.title} (${template.type})`);
      }
      
      await batch.commit();
    }
    
    console.log(`\n✅ Successfully seeded ${totalTemplatesCreated} assignment templates!`);
    console.log(`\nTemplates created for ${modules.length} modules:`);
    modules.forEach((module, index) => {
      console.log(`${index + 1}. ${module.title}`);
      console.log(`   - Project Assignment`);
      console.log(`   - Written Examination`);
    });
    
    console.log('\n📝 Note: All templates are created as inactive. Educators can activate them with due dates from the assessment management page.');
    
  } catch (error) {
    console.error('❌ Error seeding assignment templates:', error);
  } finally {
    process.exit(0);
  }
}

seedAssignmentTemplates();