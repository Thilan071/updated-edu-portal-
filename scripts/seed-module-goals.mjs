// scripts/seed-module-goals.mjs
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
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
const adminDb = getFirestore(app);

// Predefined goals for different module types/categories
const MODULE_GOALS_TEMPLATES = {
  'web_development': [
    {
      title: 'Master HTML Fundamentals',
      description: 'Understand HTML5 semantic elements, forms, and document structure',
      category: 'technical',
      difficulty: 'beginner',
      estimatedHours: 8,
      priority: 'high'
    },
    {
      title: 'CSS Styling Proficiency',
      description: 'Learn CSS selectors, flexbox, grid, and responsive design principles',
      category: 'technical',
      difficulty: 'intermediate',
      estimatedHours: 12,
      priority: 'high'
    },
    {
      title: 'JavaScript Programming',
      description: 'Master JavaScript fundamentals, DOM manipulation, and event handling',
      category: 'technical',
      difficulty: 'intermediate',
      estimatedHours: 20,
      priority: 'high'
    },
    {
      title: 'Build Responsive Websites',
      description: 'Create mobile-first, responsive web applications',
      category: 'project',
      difficulty: 'intermediate',
      estimatedHours: 15,
      priority: 'medium'
    },
    {
      title: 'Web Development Best Practices',
      description: 'Learn code organization, version control, and debugging techniques',
      category: 'professional',
      difficulty: 'intermediate',
      estimatedHours: 10,
      priority: 'medium'
    }
  ],
  'programming': [
    {
      title: 'Algorithm Understanding',
      description: 'Master fundamental algorithms and data structures',
      category: 'technical',
      difficulty: 'intermediate',
      estimatedHours: 25,
      priority: 'high'
    },
    {
      title: 'Problem Solving Skills',
      description: 'Develop logical thinking and problem decomposition abilities',
      category: 'analytical',
      difficulty: 'intermediate',
      estimatedHours: 20,
      priority: 'high'
    },
    {
      title: 'Code Quality & Testing',
      description: 'Write clean, maintainable code with proper testing',
      category: 'professional',
      difficulty: 'advanced',
      estimatedHours: 15,
      priority: 'medium'
    },
    {
      title: 'Debug Complex Issues',
      description: 'Master debugging techniques and error analysis',
      category: 'technical',
      difficulty: 'intermediate',
      estimatedHours: 12,
      priority: 'medium'
    },
    {
      title: 'Software Design Patterns',
      description: 'Understand and implement common design patterns',
      category: 'technical',
      difficulty: 'advanced',
      estimatedHours: 18,
      priority: 'low'
    }
  ],
  'database': [
    {
      title: 'SQL Query Mastery',
      description: 'Write complex SQL queries including joins, subqueries, and aggregations',
      category: 'technical',
      difficulty: 'intermediate',
      estimatedHours: 20,
      priority: 'high'
    },
    {
      title: 'Database Design',
      description: 'Design normalized database schemas and relationships',
      category: 'technical',
      difficulty: 'intermediate',
      estimatedHours: 15,
      priority: 'high'
    },
    {
      title: 'Performance Optimization',
      description: 'Optimize database queries and understand indexing strategies',
      category: 'technical',
      difficulty: 'advanced',
      estimatedHours: 12,
      priority: 'medium'
    },
    {
      title: 'Data Security',
      description: 'Implement proper data security and access control measures',
      category: 'security',
      difficulty: 'advanced',
      estimatedHours: 10,
      priority: 'medium'
    }
  ],
  'general': [
    {
      title: 'Complete All Assignments',
      description: 'Submit all required assignments with quality work',
      category: 'academic',
      difficulty: 'beginner',
      estimatedHours: 30,
      priority: 'high'
    },
    {
      title: 'Active Participation',
      description: 'Engage actively in class discussions and group activities',
      category: 'participation',
      difficulty: 'beginner',
      estimatedHours: 20,
      priority: 'medium'
    },
    {
      title: 'Master Core Concepts',
      description: 'Demonstrate understanding of fundamental module concepts',
      category: 'academic',
      difficulty: 'intermediate',
      estimatedHours: 25,
      priority: 'high'
    },
    {
      title: 'Apply Knowledge Practically',
      description: 'Use learned concepts in real-world scenarios and projects',
      category: 'project',
      difficulty: 'intermediate',
      estimatedHours: 20,
      priority: 'medium'
    },
    {
      title: 'Prepare for Assessment',
      description: 'Review materials and practice for module assessments',
      category: 'academic',
      difficulty: 'intermediate',
      estimatedHours: 15,
      priority: 'high'
    }
  ]
};

function getModuleGoals(moduleTitle, moduleDescription = '') {
  const title = moduleTitle.toLowerCase();
  const description = moduleDescription.toLowerCase();
  
  // Determine module category based on title and description
  if (title.includes('web') || title.includes('html') || title.includes('css') || title.includes('javascript')) {
    return MODULE_GOALS_TEMPLATES.web_development;
  } else if (title.includes('programming') || title.includes('coding') || title.includes('algorithm') || title.includes('software')) {
    return MODULE_GOALS_TEMPLATES.programming;
  } else if (title.includes('database') || title.includes('sql') || title.includes('data')) {
    return MODULE_GOALS_TEMPLATES.database;
  } else {
    return MODULE_GOALS_TEMPLATES.general;
  }
}

async function seedModuleGoals() {
  try {
    console.log('🌱 Starting module goals seeding...');
    
    // Get all modules
    const modulesSnapshot = await adminDb.collection('modules').get();
    console.log(`📚 Found ${modulesSnapshot.docs.length} modules`);
    
    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleData = moduleDoc.data();
      const moduleId = moduleDoc.id;
      
      console.log(`\n📖 Processing module: ${moduleData.title || moduleData.name}`);
      
      // Check if goals already exist for this module
      const existingGoalsSnapshot = await adminDb
        .collection('modules')
        .doc(moduleId)
        .collection('predefined_goals')
        .get();
      
      if (existingGoalsSnapshot.docs.length > 0) {
        console.log(`   ⚠️  Goals already exist for this module (${existingGoalsSnapshot.docs.length} goals). Skipping...`);
        continue;
      }
      
      // Get appropriate goals for this module
      const moduleGoals = getModuleGoals(
        moduleData.title || moduleData.name || '',
        moduleData.description || ''
      );
      
      // Add goals to the module's subcollection
      const batch = adminDb.batch();
      
      moduleGoals.forEach((goal, index) => {
        const goalRef = adminDb
          .collection('modules')
          .doc(moduleId)
          .collection('predefined_goals')
          .doc();
        
        const goalData = {
          id: goalRef.id,
          ...goal,
          moduleId: moduleId,
          moduleTitle: moduleData.title || moduleData.name,
          order: index + 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        batch.set(goalRef, goalData);
      });
      
      await batch.commit();
      console.log(`   ✅ Added ${moduleGoals.length} predefined goals`);
    }
    
    console.log('\n🎉 Module goals seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding module goals:', error);
    throw error;
  }
}

// Run the seeding function
seedModuleGoals()
  .then(() => {
    console.log('✨ Seeding process finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });