import { adminDb } from '../src/lib/firebaseAdmin.js';

// Script to add sample module feedback data for testing
async function seedModuleFeedback() {
  try {
    console.log('Adding sample module feedback data...');

    // Sample feedback data
    const feedbackData = [
      {
        studentId: 'EDU-2025-JUGDRI',
        moduleId: 'mod1',
        educatorId: 'educator123',
        educatorName: 'Dr. Jane Smith',
        feedback: 'Student demonstrates solid understanding of basic programming concepts but struggles with advanced object-oriented principles. Recommend focusing on inheritance and polymorphism exercises before the repeat attempt.',
        isRepeatModule: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        studentId: 'EDU-2025-JUGDRI', 
        moduleId: 'mod2',
        educatorId: 'educator123',
        educatorName: 'Prof. Mike Johnson',
        feedback: 'Mathematics foundation is weak, particularly in discrete mathematics. Student should complete additional practice problems on logic and set theory. Consider scheduling extra tutoring sessions.',
        isRepeatModule: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        studentId: 'student456',
        moduleId: 'mod3', 
        educatorId: 'educator123',
        educatorName: 'Dr. Sarah Wilson',
        feedback: 'Good progress in web development. HTML and CSS skills are strong, but JavaScript concepts need reinforcement. Focus on DOM manipulation and event handling.',
        isRepeatModule: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Add each feedback to Firestore
    for (const feedback of feedbackData) {
      const docRef = adminDb.collection('module_feedback').doc();
      feedback.id = docRef.id;
      await docRef.set(feedback);
      console.log(`✅ Added feedback: ${feedback.id}`);
    }

    console.log('🎉 Sample module feedback data added successfully!');
    console.log('You can now test the feedback functionality in the educator and student dashboards.');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  }
}

// Run the seeding function
seedModuleFeedback();
