// test-predictions-api.js
// Simple test script to verify the predictions API works

const testPredictionsAPI = async () => {
  try {
    console.log('🧪 Testing Student Predictions API...');
    
    // Test the Python backend directly first
    console.log('\n1. Testing Python Backend (http://localhost:5000/predict)');
    const pythonResponse = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Module_Difficulty: 3,
        Current_GPA: 3.2,
        Avg_Assessment_Score: 78,
        Assignments_Late: 1,
        Num_Submission_Attempts: 2,
        Login_Frequency: 15
      })
    });
    
    if (pythonResponse.ok) {
      const pythonData = await pythonResponse.json();
      console.log('✅ Python Backend Response:', pythonData);
    } else {
      console.log('❌ Python Backend Failed:', pythonResponse.status);
    }
    
    // Test the Next.js API endpoint
    console.log('\n2. Testing Next.js API (/api/student/predictions)');
    console.log('Note: This requires authentication, so it might fail in this test');
    
    const nextResponse = await fetch('http://localhost:3001/api/student/predictions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Next.js API Status:', nextResponse.status);
    
    if (nextResponse.ok) {
      const nextData = await nextResponse.json();
      console.log('✅ Next.js API Response:', nextData);
    } else {
      const errorText = await nextResponse.text();
      console.log('❌ Next.js API Error:', errorText);
    }
    
    console.log('\n✅ API Test Complete!');
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
};

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  // Running in Node.js
  const fetch = require('node-fetch');
  testPredictionsAPI();
}

module.exports = testPredictionsAPI;
