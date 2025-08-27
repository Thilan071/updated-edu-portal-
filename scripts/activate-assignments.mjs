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

async function activateAssignments() {
  try {
    console.log('🚀 Starting assignment activation...');
    
    // Get all modules first
    console.log('\n📚 Fetching modules...');
    const modulesSnapshot = await db.collection('modules').get();
    
    if (modulesSnapshot.empty) {
      console.log('❌ No modules found. Please run seed-cs-programs.mjs first.');
      return;
    }
    
    const modules = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ Found ${modules.length} modules`);
    
    // Get assignment templates for each module
    console.log('\n📋 Fetching assignment templates...');
    let totalTemplates = 0;
    const moduleTemplatesMap = new Map();
    
    for (const module of modules) {
      const templatesSnapshot = await db.collection('modules')
        .doc(module.id)
        .collection('assignment_templates')
        .get();
      
      if (!templatesSnapshot.empty) {
        const templates = templatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        moduleTemplatesMap.set(module.id, { module, templates });
        totalTemplates += templates.length;
      }
    }
    
    if (totalTemplates === 0) {
      console.log('❌ No assignment templates found. Please run seed-assignment-templates.mjs first.');
      return;
    }
    
    console.log(`✅ Found ${totalTemplates} assignment templates across ${moduleTemplatesMap.size} modules`);
    
    let activatedCount = 0;
    
    // For each module, activate one assignment template
    const moduleEntries = Array.from(moduleTemplatesMap.entries()).slice(0, 3); // Process first 3 modules
    
    for (const [moduleId, { module, templates }] of moduleEntries) {
      console.log(`\n🎯 Processing module: ${module.title}`);
      
      if (templates.length > 0) {
        // Activate the first template (Project Assignment)
        const template = templates[0];
        
        // Check if this template is already activated
        if (template.isActive) {
          console.log(`   ⚠️ Assignment already active: ${template.title}`);
          continue;
        }
        
        // Activate the assignment template directly
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (7 + activatedCount * 3)); // Stagger due dates
        
        const templateRef = db.collection('modules')
          .doc(moduleId)
          .collection('assignment_templates')
          .doc(template.id);
        
        await templateRef.update({
          isActive: true,
          dueDate: dueDate,
          activatedAt: new Date(),
          activatedBy: 'admin@eduboost.com',
          updatedAt: new Date()
        });
        
        activatedCount++;
        
        console.log(`   ✅ Activated assignment: ${template.title}`);
        console.log(`   📅 Due date: ${dueDate.toDateString()}`);
        console.log(`   🎯 Module: ${module.title}`);
      }
    }
    
    console.log('\n🎉 Assignment activation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   📋 Total templates found: ${totalTemplates}`);
    console.log(`   ✅ Assignments activated: ${activatedCount}`);
    console.log(`   📚 Modules processed: ${Math.min(moduleTemplatesMap.size, 3)}`);
    console.log(`   🎯 Modules with templates: ${moduleTemplatesMap.size}`);
    
    if (activatedCount > 0) {
      console.log('\n🎯 Active assignments created! Students should now see them in their portal.');
    }
    
  } catch (error) {
    console.error('❌ Error activating assignments:', error);
    throw error;
  }
}

// Run the activation function
activateAssignments()
  .then(() => {
    console.log('\n✅ Activation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Activation failed:', error);
    process.exit(1);
  });