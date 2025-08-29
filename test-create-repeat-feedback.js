// Test script to create feedback for repeat modules
// This will create feedback that should show up in the student repeat dashboard

const studentId = "SmupCtvdjzTpt85W168qkO46dJE2";
const educatorId = "2wO3Rbvrxhc0W8HaIEF9YfXbubO2";

// Sample feedback for modules that will appear in student repeat dashboard
const feedbackData = [
  {
    moduleId: "BeExCKnro9gSfJWB1Xm5", // Programming Fundamentals
    feedback: "Student needs to focus on programming fundamentals. Practice more loops, functions, and basic data structures. Review the concepts of variables and control flow. Complete at least 3 coding exercises daily.",
    rating: 3,
    isRepeatModule: true
  },
  {
    moduleId: "jU4J1q5jpR81uT6SwTP0", // Database Management  
    feedback: "Database concepts need improvement. Focus on SQL queries, normalization, and database design principles. Practice JOIN operations and understand entity-relationship diagrams.",
    rating: 2,
    isRepeatModule: true
  },
  {
    moduleId: "HDIFRyWDePDvySa7xLs6", // Operating System
    feedback: "Operating system fundamentals require attention. Study process management, memory allocation, and file systems. Complete lab exercises on scheduling algorithms.",
    rating: 3,
    isRepeatModule: true
  }
];

async function createRepeatFeedback() {
  console.log("Creating repeat module feedback...");
  
  for (const feedback of feedbackData) {
    try {
      const response = await fetch('http://localhost:3000/api/educator/module-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentId,
          moduleId: feedback.moduleId,
          feedback: feedback.feedback,
          rating: feedback.rating,
          isRepeatModule: feedback.isRepeatModule
        }),
        credentials: 'include'
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Created feedback for module ${feedback.moduleId}`);
      } else {
        console.log(`❌ Failed to create feedback for module ${feedback.moduleId}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error creating feedback for module ${feedback.moduleId}:`, error);
    }
  }
  
  console.log("\n🎉 Feedback creation complete!");
  console.log("📝 Now check the student repeat dashboard at:");
  console.log("http://localhost:3000/dashboard/student/repeat");
}

// Run the script
createRepeatFeedback();
