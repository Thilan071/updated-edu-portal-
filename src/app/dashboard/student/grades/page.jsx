"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function MyGrades() {
  const { data: session } = useSession();
  const [grades, setGrades] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsMounted(true);
    if (session?.user?.role === 'student') {
      fetchGrades();
    }
  }, [session]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      
      // Fetch student progress to get module marks
      const progressResponse = await fetch('/api/student-progress', {
        credentials: 'include'
      });
      
      let progressData = { progress: [] };
      if (progressResponse.ok) {
        progressData = await progressResponse.json();
      }
      
      // Fetch enrollments to get module names and details
      const enrollmentsResponse = await fetch('/api/student/enrollments', {
        credentials: 'include'
      });
      
      let moduleMap = {};
      if (enrollmentsResponse.ok) {
        const enrollmentsData = await enrollmentsResponse.json();
        enrollmentsData.enrollments.forEach(course => {
          course.modules.forEach(module => {
            moduleMap[module.id] = {
              name: module.title || module.name,
              description: module.description,
              courseTitle: course.title || course.name
            };
          });
        });
      }
      
      // Also fetch student submissions to get assignment-based grades
      const submissionsResponse = await fetch(`/api/submissions?studentId=${session.user.uid}`, {
        credentials: 'include'
      });
      
      let submissionsData = { submissions: [] };
      if (submissionsResponse.ok) {
        submissionsData = await submissionsResponse.json();
      }
      
      // Create a comprehensive grades list from both sources
      const moduleGrades = {};
      
      // Add grades from student_progress (module marks set by educators)
      progressData.progress?.forEach(progress => {
        if (progress.marks !== undefined && progress.marks !== null) {
          const moduleId = progress.moduleId;
          if (!moduleGrades[moduleId] || progress.marks > moduleGrades[moduleId].grade) {
            moduleGrades[moduleId] = {
              grade: progress.marks,
              source: 'module_mark',
              gradedAt: progress.gradedAt || progress.updatedAt,
              gradedBy: progress.graderName || 'Educator',
              status: progress.status
            };
          }
        }
      });
      
      // Add grades from submissions (assignment-based grades)
      submissionsData.submissions?.forEach(submission => {
        // Include both final grades and AI grades
        const hasGrade = submission.finalGrade || submission.aiGrade;
        const isGraded = submission.status === 'graded' || submission.status === 'ai_graded';
        
        if (hasGrade && isGraded) {
          const moduleId = submission.moduleId;
          const grade = submission.finalGrade || submission.aiGrade;
          
          // Only use submission grade if there's no module mark or if submission grade is higher
          if (!moduleGrades[moduleId] || 
              (moduleGrades[moduleId].source !== 'module_mark' && grade > moduleGrades[moduleId].grade)) {
            moduleGrades[moduleId] = {
              grade: grade,
              source: 'assignment',
              assignmentTitle: submission.assignment?.title,
              submittedAt: submission.submittedAt,
              educatorFeedback: submission.educatorFeedback,
              aiGrade: submission.aiGrade,
              aiOverallFeedback: submission.aiOverallFeedback,
              finalGrade: submission.finalGrade,
              gradedBy: submission.gradedBy || (submission.aiGrade ? 'AI Assistant' : 'Educator'),
              isAIGraded: !!submission.aiGrade && !submission.finalGrade
            };
          }
        }
      });
      
      // Transform to the expected format
      const transformedGrades = Object.keys(moduleGrades).map(moduleId => {
        const gradeData = moduleGrades[moduleId];
        const moduleInfo = moduleMap[moduleId] || {};
        
        return {
          moduleId,
          moduleName: moduleInfo.name || 'Unknown Module',
          moduleDescription: moduleInfo.description,
          courseTitle: moduleInfo.courseTitle,
          grade: gradeData.grade,
          source: gradeData.source,
          assignmentTitle: gradeData.assignmentTitle,
          submittedAt: gradeData.submittedAt,
          gradedAt: gradeData.gradedAt,
          educatorFeedback: gradeData.educatorFeedback,
          aiGrade: gradeData.aiGrade,
          aiOverallFeedback: gradeData.aiOverallFeedback,
          finalGrade: gradeData.finalGrade,
          isAIGraded: gradeData.isAIGraded,
          gradedBy: gradeData.gradedBy,
          status: gradeData.status,
          hasSubmission: gradeData.source === 'assignment'
        };
      }).filter(grade => grade.grade > 0); // Only show modules with grades
      
      setGrades(transformedGrades);
    } catch (err) {
      console.error('Error fetching grades:', err);
      setError(err.message);
      // Fallback to empty array
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (grade) => {
    if (grade >= 80) return { label: "Excellent", color: "bg-emerald-500", textColor: "text-emerald-600" };
    if (grade >= 65) return { label: "Good", color: "bg-blue-500", textColor: "text-blue-600" };
    if (grade >= 50) return { label: "At Risk", color: "bg-amber-400", textColor: "text-amber-600" };
    return { label: "Fail", color: "bg-red-500", textColor: "text-red-600" };
  };

  // Calculate summary statistics
  const totalModules = grades.length;
  const passedModules = grades.filter(g => g.grade >= 50).length;
  const averageGrade = totalModules === 0 ? 0 : (grades.reduce((sum, g) => sum + g.grade, 0) / totalModules).toFixed(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600 text-lg">Loading grades...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Error: {error}</div>
          <button 
            onClick={fetchGrades}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Animation for individual grade cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .grade-card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        /* Glass-effect for white background with slight transparency */
        .glass-effect {
          background-color: rgba(255, 255, 255, 0.8); /* Predominantly white, slight transparency */
          backdrop-filter: blur(8px) saturate(180%); /* Reduced blur slightly for white */
          -webkit-backdrop-filter: blur(8px) saturate(180%); /* Safari support */
          border: 1px solid rgba(0, 0, 0, 0.08); /* Subtle border for definition */
          box-shadow: 0 5px 25px 0 rgba(0, 0, 0, 0.15); /* Lighter, but present shadow */
          transition: all 0.3s ease-in-out; /* Smooth transition for glass effect properties */
        }

        /* Hover effect for glass cards */
        .glass-effect:hover {
          background-color: rgba(255, 255, 255, 0.9); /* More opaque on hover */
          border-color: rgba(0, 0, 0, 0.15); /* Slightly darker border on hover */
          box-shadow: 0 8px 30px 0 rgba(0, 0, 0, 0.25); /* More pronounced shadow on hover */
        }

        /* Updated Fonts */
        .main-font {
            font-family: 'Lato', sans-serif; /* Body text font */
        }
        .header-font {
            font-family: 'Montserrat', sans-serif; /* Headers font */
        }

        /* Basic fade-in for the main component heading */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animated-entry {
          animation: fadeIn 0.8s ease-out forwards;
        }

        /* New: Divider animation */
        @keyframes drawLine {
          from { width: 0%; }
          to { width: 100%; }
        }

        .animated-divider {
            animation: drawLine 1s ease-out forwards;
            animation-delay: 0.5s; /* Delay after heading appears */
        }

        /* Progress bar fill animation for grades */
        @keyframes gradeProgressBarFill {
            from { width: 0%; }
            to { width: var(--grade-width, 0%); } /* Use CSS variable for target width */
        }
        .grade-progress-bar-animated {
            animation: gradeProgressBarFill 1.5s ease-out forwards;
        }

      `}</style>
      <div className="main-font"> {/* Apply the main font */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4 header-font animated-entry"> {/* Changed heading color */}
          My Grades
        </h1>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div> {/* Changed divider color */}

        {/* New: Summary Section for Grades */}
        <div className={`glass-effect p-6 rounded-xl shadow-lg mb-8 grid grid-cols-1 md:grid-cols-3 gap-6
            transform ${isMounted ? 'grade-card-animated' : 'opacity-0 scale-95'}`}
            style={{ animationDelay: '0.1s' }}>
          <div className="text-center">
            <p className="text-gray-600 text-lg">Total Modules</p>
            <p className="text-blue-700 text-5xl font-extrabold header-font mt-2">{totalModules}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-lg">Passed Modules</p>
            <p className="text-emerald-600 text-5xl font-extrabold header-font mt-2">{passedModules}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-lg">Average Grade</p>
            <p className="text-blue-700 text-5xl font-extrabold header-font mt-2">{averageGrade}%</p>
          </div>
        </div>

        <div className="space-y-6">
          {grades.map((g, idx) => {
            const status = getStatus(g.grade);
            return (
              <div
                key={idx}
                className={`glass-effect p-6 rounded-xl shadow-lg space-y-4
                  transform hover:scale-[1.01] transition-all duration-300
                  ${isMounted ? 'grade-card-animated' : 'opacity-0 scale-95'}`}
                style={{ animationDelay: `${0.2 + idx * 0.08}s` }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800">{g.moduleName}</h2>
                    {g.moduleDescription && (
                      <p className="text-sm text-gray-600 mt-1">{g.moduleDescription}</p>
                    )}
                    {g.courseTitle && (
                      <p className="text-sm text-blue-600 mt-1">Course: {g.courseTitle}</p>
                    )}
                    
                    {/* Grade Source Information */}
                    <div className="mt-2 flex items-center gap-2">
                      {g.source === 'module_mark' ? (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          ✓ Module Grade
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          📋 Assignment Grade
                        </span>
                      )}
                      
                      {g.gradedBy && (
                        <span className="text-xs text-gray-500">
                          Graded by: {g.gradedBy}
                        </span>
                      )}
                      
                      {g.isAIGraded && (
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full ml-2">
                          🤖 AI Graded
                        </span>
                      )}
                    </div>
                    
                    {g.assignmentTitle && (
                      <p className="text-sm text-gray-600 mt-1">Assignment: {g.assignmentTitle}</p>
                    )}
                    
                    {/* Date Information */}
                    <div className="mt-2 text-xs text-gray-500">
                      {g.submittedAt && (
                        <p>Submitted: {new Date(g.submittedAt.seconds ? g.submittedAt.seconds * 1000 : g.submittedAt).toLocaleDateString()}</p>
                      )}
                      {g.gradedAt && (
                        <p>Graded: {new Date(g.gradedAt.seconds ? g.gradedAt.seconds * 1000 : g.gradedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-gray-800">{g.grade}%</div>
                    <div className={`text-sm font-semibold ${status.textColor}`}>{status.label}</div>
                    
                    {/* Status indicators */}
                    <div className="mt-2 space-y-1">
                      {g.source === 'module_mark' && (
                        <div className="text-xs text-blue-600">🎯 Final Module Grade</div>
                      )}
                      {g.hasSubmission && (
                        <div className="text-xs text-green-600">📝 Assignment Based</div>
                      )}
                      {g.status === 'completed' && (
                        <div className="text-xs text-green-600">✅ Completed</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative w-full bg-gray-300 h-4 rounded-full">
                  <div
                    className={`${status.color} h-4 rounded-full grade-progress-bar-animated`}
                    style={{ width: `${g.grade}%`, '--grade-width': `${g.grade}%` }}
                  >
                  </div>
                </div>

                {g.educatorFeedback && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <p className="text-sm font-semibold text-blue-800 mb-1">Educator Feedback:</p>
                    <p className="text-sm text-blue-700">{g.educatorFeedback}</p>
                  </div>
                )}
                
                {g.aiOverallFeedback && (
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded mt-2">
                    <p className="text-sm font-semibold text-purple-800 mb-1">AI Feedback:</p>
                    <p className="text-sm text-purple-700">{g.aiOverallFeedback}</p>
                    {g.aiGrade && g.finalGrade && (
                      <p className="text-xs text-purple-600 mt-1">
                        AI Grade: {g.aiGrade}% | Final Grade: {g.finalGrade}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {grades.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No grades available yet</div>
            <p className="text-gray-400">Complete and submit assignments to see your grades here.</p>
          </div>
        )}
      </div>
    </>
  );
}
