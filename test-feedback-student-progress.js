// Test script to verify feedback is saved in student_progress collection
// This script demonstrates the new feedback storage mechanism

console.log('🧪 Testing Module Feedback Storage in Student Progress Collection');
console.log('=============================================================');

// Test data
const testData = {
  studentId: "SmupCtvdjzTpt85W168qkO46dJE2", // Sample student ID
  moduleId: "BeExCKnro9gSfJWB1Xm5", // Sample module ID
  feedback: "This module requires additional practice. Focus on programming fundamentals, especially loops and conditional statements. Student should complete at least 3 practice problems daily.",
  isRepeatModule: true
};

console.log('📋 Test Data:');
console.log(`   Student ID: ${testData.studentId}`);
console.log(`   Module ID: ${testData.moduleId}`);
console.log(`   Feedback: ${testData.feedback}`);
console.log(`   Is Repeat Module: ${testData.isRepeatModule}`);
console.log('');

// Function to test feedback saving
async function testFeedbackSaving() {
  console.log('1️⃣  Testing Feedback Saving...');
  
  try {
    const response = await fetch('http://localhost:3000/api/educator/module-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Feedback saved successfully!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
      return true;
    } else {
      console.error('❌ Failed to save feedback:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('📄 Error response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving feedback:', error);
    return false;
  }
}

// Function to test feedback retrieval
async function testFeedbackRetrieval() {
  console.log('2️⃣  Testing Feedback Retrieval...');
  
  try {
    const response = await fetch(`http://localhost:3000/api/educator/module-feedback?studentId=${testData.studentId}&moduleId=${testData.moduleId}`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Feedback retrieved successfully!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.feedbacks.length > 0) {
        const feedback = result.feedbacks[0];
        console.log('✅ Feedback found in student_progress collection');
        console.log(`   Feedback Text: ${feedback.feedback}`);
        console.log(`   Is Repeat Module: ${feedback.isRepeatModule}`);
        console.log(`   Educator: ${feedback.educatorName}`);
      }
      return true;
    } else {
      console.error('❌ Failed to retrieve feedback:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error retrieving feedback:', error);
    return false;
  }
}

// Function to test repeat modules retrieval for student
async function testRepeatModulesRetrieval() {
  console.log('3️⃣  Testing Repeat Modules Retrieval (Student View)...');
  
  try {
    const response = await fetch(`http://localhost:3000/api/educator/module-feedback?studentId=${testData.studentId}&onlyRepeatModules=true`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Repeat modules feedback retrieved successfully!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.feedbacks.length > 0) {
        console.log(`✅ Found ${result.feedbacks.length} repeat module(s) with feedback`);
        result.feedbacks.forEach((feedback, index) => {
          console.log(`   ${index + 1}. ${feedback.moduleTitle || 'Unknown Module'}`);
          console.log(`      Feedback: ${feedback.feedback}`);
          console.log(`      Educator: ${feedback.educatorName}`);
        });
      } else {
        console.log('ℹ️  No repeat modules with feedback found');
      }
      return true;
    } else {
      console.error('❌ Failed to retrieve repeat modules:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error retrieving repeat modules:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Integration Tests...');
  console.log('');
  
  const test1 = await testFeedbackSaving();
  console.log('');
  
  if (test1) {
    const test2 = await testFeedbackRetrieval();
    console.log('');
    
    const test3 = await testRepeatModulesRetrieval();
    console.log('');
    
    if (test1 && test2 && test3) {
      console.log('🎉 All tests passed! Feedback system is working correctly with student_progress collection.');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.');
    }
  } else {
    console.log('⚠️  Initial test failed. Cannot proceed with other tests.');
  }
}

// Instructions for running the test
console.log('📝 Instructions:');
console.log('1. Make sure the development server is running (npm run dev)');
console.log('2. Make sure you are logged in as an educator in the browser');
console.log('3. Open browser console and run: runTests()');
console.log('4. Or copy the functions above and run them individually');
console.log('');
console.log('🔧 Available Functions:');
console.log('- testFeedbackSaving() - Test saving feedback to student_progress');
console.log('- testFeedbackRetrieval() - Test retrieving feedback from student_progress');
console.log('- testRepeatModulesRetrieval() - Test getting repeat modules for student view');
console.log('- runTests() - Run all tests sequentially');
console.log('');

// Export functions for manual testing
if (typeof window !== 'undefined') {
  window.testFeedbackSaving = testFeedbackSaving;
  window.testFeedbackRetrieval = testFeedbackRetrieval;
  window.testRepeatModulesRetrieval = testRepeatModulesRetrieval;
  window.runTests = runTests;
}