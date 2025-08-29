// Test the educator dashboard API endpoints directly
async function testEducatorAPIEndpoints() {
  const testEducatorId = '2wO3Rbvrxhc0W8HaIEF9YfXbubO2'; // lecturer1 from debug output
  
  console.log('🧪 Testing educator API endpoints...\n');

  try {
    // Test modules endpoint
    console.log('📚 Testing modules endpoint...');
    const modulesResponse = await fetch(`http://localhost:3000/api/educators/${testEducatorId}/modules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (modulesResponse.ok) {
      const modulesData = await modulesResponse.json();
      console.log(`   ✅ Modules API works: ${modulesData.modules?.length || 0} modules`);
      console.log(`   Sample module:`, modulesData.modules?.[0]?.title || 'No modules');
    } else {
      console.log(`   ❌ Modules API failed: ${modulesResponse.status} - ${modulesResponse.statusText}`);
      const errorText = await modulesResponse.text();
      console.log(`   Error: ${errorText}`);
    }

    // Test students endpoint  
    console.log('\n👥 Testing students endpoint...');
    const studentsResponse = await fetch(`http://localhost:3000/api/educators/${testEducatorId}/students`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (studentsResponse.ok) {
      const studentsData = await studentsResponse.json();
      console.log(`   ✅ Students API works: ${studentsData.students?.length || 0} students`);
      console.log(`   Sample student:`, studentsData.students?.[0]?.firstName || 'No students');
    } else {
      console.log(`   ❌ Students API failed: ${studentsResponse.status} - ${studentsResponse.statusText}`);
      const errorText = await studentsResponse.text();
      console.log(`   Error: ${errorText}`);
    }

    // Test assessments endpoint
    console.log('\n� Testing assessments endpoint...');
    const assessmentsResponse = await fetch(`http://localhost:3000/api/educators/${testEducatorId}/assessments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (assessmentsResponse.ok) {
      const assessmentsData = await assessmentsResponse.json();
      console.log(`   ✅ Assessments API works: ${assessmentsData.assessments?.length || 0} assessments`);
      console.log(`   Sample assessment:`, assessmentsData.assessments?.[0]?.title || 'No assessments');
    } else {
      console.log(`   ❌ Assessments API failed: ${assessmentsResponse.status} - ${assessmentsResponse.statusText}`);
      const errorText = await assessmentsResponse.text();
      console.log(`   Error: ${errorText}`);
    }

  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  }
}

// Wait for server to start
setTimeout(testEducatorAPIEndpoints, 3000);
