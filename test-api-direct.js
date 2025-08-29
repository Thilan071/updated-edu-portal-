// Test script to directly call the analytics API
async function testAnalyticsAPI() {
  console.log('🧪 Testing Analytics API directly...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/analytics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, you'd need authentication headers
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.analytics.assessmentCompletion) {
        console.log('\n📊 Assessment Completion Data:');
        data.analytics.assessmentCompletion.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.module}: ${item.completed}%`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

testAnalyticsAPI();
