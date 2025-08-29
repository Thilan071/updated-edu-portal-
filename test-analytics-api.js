const https = require('https');
const http = require('http');

// Test the analytics API directly
async function testAnalyticsAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/analytics',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Note: In production, you'd need proper authentication headers
      'Cookie': 'your-session-cookie-here' // This would need to be a real session
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('📊 Analytics API Response:');
          console.log(JSON.stringify(jsonData, null, 2));
          
          if (jsonData.analytics && jsonData.analytics.assessmentCompletion) {
            console.log('\n📈 Assessment Completion Data:');
            console.log(jsonData.analytics.assessmentCompletion);
          }
          
          resolve(jsonData);
        } catch (error) {
          console.error('Error parsing response:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.end();
  });
}

testAnalyticsAPI()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
