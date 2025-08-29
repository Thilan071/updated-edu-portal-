// Script to add test student progress data with scores below 50%
// This will populate the repeat modules for testing

const testProgressData = [
  {
    studentId: "SmupCtvdjzTpt85W168qkO46dJE2",
    moduleId: "BeExCKnro9gSfJWB1Xm5", // This matches your existing feedback
    marks: 42,
    score: 42,
    status: "needs_improvement",
    attemptNumber: 2
  },
  {
    studentId: "SmupCtvdjzTpt85W168qkO46dJE2", 
    moduleId: "mod_database_001",
    marks: 35,
    score: 35,
    status: "needs_improvement",
    attemptNumber: 2
  },
  {
    studentId: "SmupCtvdjzTpt85W168qkO46dJE2",
    moduleId: "mod_os_001", 
    marks: 28,
    score: 28,
    status: "needs_improvement",
    attemptNumber: 3
  }
];

async function addTestProgress() {
  for (const progress of testProgressData) {
    try {
      const response = await fetch('http://localhost:3000/api/student-progress/module-marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Added progress for module:', progress.moduleId, 'Score:', progress.marks);
      } else {
        console.error('Failed to add progress for module:', progress.moduleId, response.status);
      }
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  }
}

console.log('Test data prepared. Run addTestProgress() when authenticated.');
console.log('Progress data:', testProgressData);
