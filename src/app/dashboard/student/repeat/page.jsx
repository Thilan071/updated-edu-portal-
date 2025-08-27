"use client";
import { useState, useEffect } from "react";
import mlApiClient from "@/lib/mlApiClient";
import { useSession } from "next-auth/react";
import GoalProgressService from "@/lib/goalProgressService";
import { goalsAPI } from "@/lib/apiClient";

export default function RepeatPreparation() {
  const { data: session, status } = useSession();
  const [repeatModules, setRepeatModules] = useState([]);
  const [isMounted, setIsMounted] = useState(false); // For entry animations
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleGoals, setModuleGoals] = useState(null);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalProgress, setGoalProgress] = useState({});
  const [moduleProgressData, setModuleProgressData] = useState({});
  const [savingGoals, setSavingGoals] = useState(false);

  // Debug session state
  useEffect(() => {
    // Session is ready, component can proceed
    if (session?.user?.id) {
      loadUserProgress();
    }
  }, [session, status]);

  // Load user progress data from Firebase
  const loadUserProgress = async () => {
    if (!session?.user?.id) return;
    
    try {
      const userProgress = await GoalProgressService.getAllUserProgress(session.user.id);
      
      // Calculate module progress data for cards
      const moduleProgressData = {};
      Object.keys(userProgress).forEach(moduleName => {
        const moduleGoals = userProgress[moduleName];
        const totalGoals = Object.keys(moduleGoals).length;
        const completedGoals = Object.values(moduleGoals).filter(goal => goal.completed).length;
        const progressPercentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
        
        moduleProgressData[moduleName] = {
          progressPercentage,
          completedGoals,
          totalGoals
        };
      });
      
      setModuleProgressData(moduleProgressData);
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsMounted(true);
    fetchRepeatModules();
  }, []);

  const fetchRepeatModules = async () => {
    // Dummy data — connect to backend later
    const data = [
      {
        moduleName: "Database Management",
        currentAttempt: 2,
        lastScore: 48,
        plan: "Focus on Normalization & SQL Joins. Complete at least 5 past papers. Attend revision labs.",
        progress: 60
      },
      {
        moduleName: "Programming Fundamentals",
        currentAttempt: 2,
        lastScore: 52,
        plan: "Revise basic programming concepts. Practice loops, functions, and data structures.",
        progress: 30
      },
      {
        moduleName: "Operating System",
        currentAttempt: 2,
        lastScore: 45,
        plan: "Study process management and memory allocation. Complete lab exercises on scheduling algorithms.",
        progress: 40
      },
      {
        moduleName: "Introduction to Machine Learning",
        currentAttempt: 2,
        lastScore: 38,
        plan: "Deep dive into machine learning algorithms. Complete mini-projects on classification and regression.",
        progress: 25
      }
    ];
    setRepeatModules(data);
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return "bg-gradient-to-br from-emerald-500 to-green-600";
    if (progress >= 50) return "bg-gradient-to-br from-amber-400 to-orange-500";
    return "bg-gradient-to-br from-red-500 to-rose-600";
  };

  const handleCardClick = async (moduleName) => {
    if (status === 'loading') {
      alert('Session is loading, please wait a moment and try again.');
      return;
    }
    
    if (status === 'unauthenticated') {
      alert('You are not logged in. Please log in first.');
      return;
    }
    
    if (!session?.user?.id) {
      alert('User session is incomplete. Please log out and log in again.');
      return;
    }

    setSelectedModule(moduleName);
    setLoadingGoals(true);
    setShowGoalsModal(true);

    try {
      const goalsData = await mlApiClient.getModuleGoals(session.user.id, moduleName);
      setModuleGoals(goalsData);
      
      // Load goal progress for this module
      const moduleProgress = await GoalProgressService.getModuleProgress(session.user.id, moduleName);
      setGoalProgress(moduleProgress);
    } catch (error) {
      console.error('Error fetching module goals:', error);
      setModuleGoals({ error: 'Failed to load personalized goals. Please try again.' });
    } finally {
      setLoadingGoals(false);
    }
  };

  const closeGoalsModal = () => {
    setShowGoalsModal(false);
    setSelectedModule(null);
    setModuleGoals(null);
    setLoadingGoals(false);
    setGoalProgress({});
  };

  // Handle goal completion toggle
  const handleGoalToggle = async (goalId) => {
    if (!session?.user?.id || !selectedModule || !moduleGoals) return;
    
    try {
      // Find the goal data for progress calculation
      const goalData = moduleGoals.goals.find(goal => goal.goal_id === goalId);
      
      const result = await GoalProgressService.toggleGoalCompletionEnhanced(
         session.user.id,
         selectedModule,
         goalId,
         goalData
       );
      
      if (result.success) {
        // Update local goal progress state
        setGoalProgress(prev => ({
          ...prev,
          [goalId]: {
            ...prev[goalId],
            completed: result.data.completed,
            progress: result.data.progress,
            lastUpdated: result.data.lastUpdated
          }
        }));
        
        // Refresh user progress data to update main cards
        await loadUserProgress();
      }
    } catch (error) {
      console.error('Error toggling goal:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Save AI-generated goals to user's goals list
  const saveGoalsToList = async () => {
    if (!moduleGoals?.goals || !session?.user?.id) return;
    
    setSavingGoals(true);
    let savedCount = 0;
    let errorCount = 0;
    
    try {
      for (const goal of moduleGoals.goals) {
        try {
          await goalsAPI.add({
            goal: goal.goal_title + ': ' + goal.goal_description
          });
          savedCount++;
        } catch (error) {
          console.error('Error saving goal:', goal.goal_title, error);
          errorCount++;
        }
      }
      
      if (savedCount > 0) {
        alert(`Successfully saved ${savedCount} goals to your goals list!${errorCount > 0 ? ` (${errorCount} failed to save)` : ''}`);
      } else {
        alert('Failed to save goals. Please try again.');
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Failed to save goals. Please try again.');
    } finally {
      setSavingGoals(false);
    }
  };

  return (
    <>
      <style jsx>{`
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Animation for individual module cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .repeat-card-animated {
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

        /* Progress bar fill animation */
        @keyframes progressBarFill {
            from { width: 0%; }
            to { width: var(--progress-width, 0%); } /* Use CSS variable for target width */
        }
        .progress-bar-animated {
            animation: progressBarFill 1.5s ease-out forwards;
        }
      `}</style>
      <div className="main-font"> {/* Apply the main font */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4 header-font animated-entry">
          Repeat Preparation
        </h1>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div>

        <div className="space-y-6">
          {repeatModules.map((mod, idx) => (
            <div
              key={idx}
              className={`glass-effect p-6 rounded-xl shadow-lg space-y-4
                transform hover:scale-[1.01] transition-all duration-300 cursor-pointer
                ${isMounted ? 'repeat-card-animated' : 'opacity-0 scale-95'}`}
              style={{ animationDelay: `${0.2 + idx * 0.08}s` }}
              onClick={() => handleCardClick(mod.moduleName)}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-800">{mod.moduleName}</h2>
                <div className="flex items-center space-x-2">
                  <div className="text-md text-gray-600">Attempt <strong className="font-bold text-blue-700">#{mod.currentAttempt}</strong></div>
                  <div className="text-sm text-blue-600 font-medium">Click for AI Goals →</div>
                </div>
              </div>

              <p className="text-gray-700">Last Score: <strong className="font-bold text-blue-700">{mod.lastScore}%</strong></p>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-gray-800">
                <h3 className="font-semibold mb-2 text-blue-700 text-lg">Preparation Plan:</h3>
                <p>{mod.plan}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Current Progress:</span>
                  <span className="font-semibold text-blue-700">
                    {moduleProgressData[mod.moduleName]?.progressPercentage || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-300 h-4 rounded-full">
                  <div
                    className={`${getProgressColor(moduleProgressData[mod.moduleName]?.progressPercentage || 0)} h-4 rounded-full progress-bar-animated`}
                    style={{ 
                      width: `${moduleProgressData[mod.moduleName]?.progressPercentage || 0}%`, 
                      '--progress-width': `${moduleProgressData[mod.moduleName]?.progressPercentage || 0}%` 
                    }}
                  ></div>
                </div>
                {moduleProgressData[mod.moduleName] && (
                  <div className="text-xs text-gray-500">
                    {moduleProgressData[mod.moduleName].completedGoals} of {moduleProgressData[mod.moduleName].totalGoals} goals completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* AI Goals Modal */}
        {showGoalsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800 header-font">
                    🎯 Suggested Goals for {selectedModule}
                  </h2>
                  <div className="flex items-center space-x-3">
                    {moduleGoals?.goals && (
                      <button
                        onClick={saveGoalsToList}
                        disabled={savingGoals}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        {savingGoals ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            <span>Save to Goals</span>
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={closeGoalsModal}
                      className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {loadingGoals ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-lg text-gray-600">Loading personalized goals...</span>
                  </div>
                ) : moduleGoals?.error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 text-lg mb-4">⚠️ {moduleGoals.error}</div>
                    <button
                      onClick={() => handleCardClick(selectedModule)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : moduleGoals?.goals ? (
                  <div className="space-y-6">
                    {/* Goals Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800">Total Goals</h3>
                        <p className="text-2xl font-bold text-blue-600">{moduleGoals.goals.length}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800">High Priority</h3>
                        <p className="text-2xl font-bold text-green-600">
                          {moduleGoals.goals.filter(g => g.priority_level === 'high').length}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h3 className="font-semibold text-yellow-800">Days to Complete</h3>
                        <p className="text-2xl font-bold text-yellow-600">
                          {Math.min(...moduleGoals.goals.map(g => g.days_remaining))}
                        </p>
                      </div>
                    </div>

                    {/* Individual Goals */}
                    <div className="space-y-4">
                      {moduleGoals.goals.map((goal, idx) => {
                        const isCompleted = goalProgress[goal.goal_id]?.completed || false;
                        const goalProgressPercent = goalProgress[goal.goal_id]?.progress || goal.current_progress || 0;
                        
                        return (
                        <div key={goal.goal_id} className={`border rounded-lg p-4 hover:shadow-md transition-all duration-300 ${
                          isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-start space-x-3">
                              <div className="flex items-center mt-1">
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={() => handleGoalToggle(goal.goal_id)}
                                  className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer"
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className={`text-lg font-semibold ${
                                  isCompleted ? 'text-green-800 line-through' : 'text-gray-800'
                                }`}>{goal.goal_title}</h3>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isCompleted && (
                                <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                              )}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(goal.priority_level)}`}>
                                {goal.priority_level.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          <p className={`mb-3 ${
                            isCompleted ? 'text-gray-500' : 'text-gray-600'
                          }`}>{goal.goal_description}</p>
                          
                          <div className="mb-3">
                            <h4 className={`font-medium mb-2 ${
                              isCompleted ? 'text-gray-500' : 'text-gray-700'
                            }`}>Success Criteria:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {goal.success_criteria.map((criteria, criteriaIdx) => (
                                <li key={criteriaIdx} className={`text-sm ${
                                  isCompleted ? 'text-gray-400 line-through' : 'text-gray-600'
                                }`}>{criteria}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Progress: {goalProgressPercent}%</span>
                            <span>Due: {goal.target_completion_date}</span>
                            <span>{goal.days_remaining} days remaining</span>
                          </div>
                          
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-green-600' : 'bg-blue-600'
                              }`}
                              style={{ width: `${goalProgressPercent}%` }}
                            ></div>
                          </div>
                          
                          {isCompleted && goalProgress[goal.goal_id]?.lastUpdated && (
                            <div className="mt-2 text-xs text-green-600">
                              Completed on {new Date(goalProgress[goal.goal_id].lastUpdated).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>

                    {/* Recommendations */}
                    {moduleGoals.recommendations && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 mb-3">🤖 AI Recommendations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-blue-700">Suggested Daily Study:</span>
                            <span className="ml-2 text-blue-600">{moduleGoals.recommendations.suggested_daily_study_hours} hours</span>
                          </div>
                          <div>
                            <span className="font-medium text-blue-700">Estimated Completion:</span>
                            <span className="ml-2 text-blue-600">{moduleGoals.recommendations.estimated_completion_weeks} weeks</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 text-lg">No goals found for this module.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
