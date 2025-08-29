// Test script for module feedback functionality
// Run this after logging in as an educator

const testModuleFeedback = async () => {
  // Test data - replace with actual student and module IDs from your database
  const testData = {
    studentId: 'EDU-2025-JUGDRI', // Student ID from the screenshot
    moduleId: 'mod1', // Replace with actual module ID
    feedback: 'Student shows good understanding of basic concepts but needs more practice with advanced topics. Recommend additional exercises on loops and functions before attempting the repeat exam.',
    isRepeatModule: true
  };

  try {
    const response = await fetch('/api/educator/module-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Feedback creation result:', result);

    if (result.success) {
      console.log('✅ Feedback created successfully!');
      
      // Now test retrieving the feedback
      const getResponse = await fetch(`/api/educator/module-feedback?studentId=${testData.studentId}&onlyRepeatModules=true`, {
        credentials: 'include'
      });
      
      const getFeedback = await getResponse.json();
      console.log('Retrieved feedback:', getFeedback);
    } else {
      console.error('❌ Failed to create feedback:', result);
    }
  } catch (error) {
    console.error('❌ Error testing feedback:', error);
  }
};

// Run this in browser console after logging in as an educator
console.log('Module Feedback Test Script loaded. Run testModuleFeedback() to test.');
