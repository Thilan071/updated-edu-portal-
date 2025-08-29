"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, Target, BookOpen, Zap, CheckCircle, Circle, Trophy, Clock, Star } from "lucide-react";
import mlApiClient from "@/lib/mlApiClient";
import GoalProgressService from "@/lib/goalProgressService";

export default function GoalsTracker() {
  const { data: session } = useSession();
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleGoals, setModuleGoals] = useState(null);
  const [overallStats, setOverallStats] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('predefined'); // 'predefined' or 'ai_suggested'
  const [aiSuggestedGoals, setAiSuggestedGoals] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user?.id) {
      fetchEnrolledModules();
    }
  }, [session]);

  // Click outside handler for dropdown (simplified since we have backdrop)
  useEffect(() => {
    // ESC key handler
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  const fetchEnrolledModules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/student/enrolled-modules?studentId=${session.user.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEnrolledModules(data.modules || []);
          setOverallStats(data.statistics);
          
          // Auto-select first module if available
          if (data.modules && data.modules.length > 0) {
            const firstModuleWithGoals = data.modules.find(m => m.goals.totalCount > 0);
            if (firstModuleWithGoals) {
              setSelectedModule(firstModuleWithGoals);
              await fetchModuleGoals(firstModuleWithGoals.id);
              await fetchAiSuggestedGoals(firstModuleWithGoals.title);
            } else {
              // Select first module even if no goals
              setSelectedModule(data.modules[0]);
              await fetchModuleGoals(data.modules[0].id);
              await fetchAiSuggestedGoals(data.modules[0].title);
            }
          }
        } else {
          throw new Error(data.error || 'Failed to fetch enrolled modules');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching enrolled modules:', error);
      setError('Failed to load modules. Please try again.');
      // Set empty data as fallback
      setEnrolledModules([]);
      setOverallStats({
        totalModules: 0,
        totalGoals: 0,
        totalCompletedGoals: 0,
        overallProgress: 0,
        modulesWithGoals: 0,
        modulesCompleted: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleGoals = async (moduleId) => {
    try {
      setGoalsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/student/module-goals?moduleId=${moduleId}&studentId=${session.user.id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setModuleGoals(data);
        } else {
          throw new Error(data.error || 'Failed to fetch module goals');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching module goals:', error);
      setError('Failed to load module goals. Please try again.');
      // Set empty goals data as fallback
      setModuleGoals({
        success: true,
        module: selectedModule,
        goals: {
          predefined: [],
          aiGenerated: [],
          all: []
        },
        stats: {
          totalGoals: 0,
          completedGoals: 0,
          overallProgress: 0,
          predefinedGoalsCount: 0,
          aiGoalsCount: 0
        }
      });
    } finally {
      setGoalsLoading(false);
    }
  };

  const fetchAiSuggestedGoals = async (moduleTitle) => {
    if (!session?.user?.id || !moduleTitle) return;
    
    try {
      // Fetch AI-suggested goals from user's goals subcollection
      const response = await fetch(`/api/goals?moduleTitle=${encodeURIComponent(moduleTitle)}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter goals that are related to this module (from repeat page AI suggestions)
        const moduleAiGoals = data.goals?.filter(goal => 
          goal.goal && goal.goal.toLowerCase().includes(moduleTitle.toLowerCase())
        ) || [];
        setAiSuggestedGoals(moduleAiGoals);
      } else {
        console.error('Failed to fetch AI-suggested goals');
        setAiSuggestedGoals([]);
      }
    } catch (error) {
      console.error('Error fetching AI-suggested goals:', error);
      setAiSuggestedGoals([]);
    }
  };

  const handleModuleSelect = async (selectedModule) => {
    try {
      setSelectedModule(selectedModule);
      setShowDropdown(false);
      await fetchModuleGoals(selectedModule.id);
      await fetchAiSuggestedGoals(selectedModule.title); // Fetch AI-suggested goals
    } catch (error) {
      console.error('Error selecting module:', error);
      setError('Failed to select module. Please try again.');
    }
  };

  const toggleGoalCompletion = async (goalId, goalType) => {
    if (!selectedModule || !moduleGoals) return;
    
    try {
      const result = await GoalProgressService.toggleGoalCompletionEnhanced(
        session.user.id,
        selectedModule.title,
        goalId,
        { goal_id: goalId }
      );
      
      if (result.success) {
        // Refresh module goals to show updated progress
        await fetchModuleGoals(selectedModule.id);
        await fetchEnrolledModules(); // Refresh overall stats
      }
    } catch (error) {
      console.error('Error toggling goal completion:', error);
      setError('Failed to update goal progress. Please try again.');
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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <style jsx>{`
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Animation for individual goal cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .goal-card-animated {
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

        /* Button hover effect */
        .btn-hover-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4); /* Cyan glow */
        }

        /* Dropdown specific styles */
        .module-dropdown {
          position: relative;
          z-index: 10000 !important;
        }
        
        .dropdown-menu {
          position: absolute !important;
          z-index: 99999 !important;
          transform: translateZ(0); /* Force hardware acceleration */
          isolation: isolate; /* Create new stacking context */
        }

        /* Ensure dropdown stays above glass effect cards */
        .glass-effect {
          position: relative;
          z-index: 1;
        }

        .dropdown-open .glass-effect {
          z-index: 0;
        }

        /* Auto-adjusting dropdown card */
        .dropdown-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .dropdown-card.expanded {
          min-height: auto;
          padding-bottom: 1.5rem;
        }

        .dropdown-card.collapsed {
          min-height: auto;
        }

        /* Smooth dropdown animation */
        .dropdown-menu {
          animation: slideDown 0.2s ease-out;
          transform-origin: top;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scaleY(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
      `}</style>
      <div className={`main-font ${showDropdown ? 'dropdown-open' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-gray-800 header-font animated-entry">
            📚 Module Goals Tracker
          </h1>
        </div>
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 ml-2 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading modules and goals...</span>
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {/* Overall Progress Section */}
            {overallStats && (
              <div className={`glass-effect p-6 rounded-xl shadow-lg mb-8
                  transform ${isMounted ? 'goal-card-animated' : 'opacity-0 scale-95'}`}
                  style={{ animationDelay: '0.1s' }}>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                  Overall Progress
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{overallStats.totalModules}</div>
                    <div className="text-sm text-gray-600">Total Modules</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{overallStats.totalGoals}</div>
                    <div className="text-sm text-gray-600">Total Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{overallStats.totalCompletedGoals}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{overallStats.overallProgress}%</div>
                    <div className="text-sm text-gray-600">Progress</div>
                  </div>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full progress-bar-animated"
                    style={{ 
                      width: `${overallStats.overallProgress}%`, 
                      '--progress-width': `${overallStats.overallProgress}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Module Selection Dropdown */}
            {enrolledModules.length > 0 && (
              <div className={`glass-effect dropdown-card p-6 rounded-xl shadow-lg mb-8
                  transform ${isMounted ? 'goal-card-animated' : 'opacity-0 scale-95'}
                  ${showDropdown ? 'expanded' : 'collapsed'}`}
                  style={{ 
                    animationDelay: '0.2s',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    minHeight: showDropdown ? '20rem' : 'auto',
                    paddingBottom: showDropdown ? '16rem' : '1.5rem',
                    transform: showDropdown ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: showDropdown ? '0 20px 40px -10px rgba(0, 0, 0, 0.15)' : '0 5px 25px 0 rgba(0, 0, 0, 0.15)'
                  }}>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-blue-500" />
                  Select Module
                </h2>
                <div className="relative module-dropdown" style={{ 
                  zIndex: 10000,
                  marginBottom: showDropdown ? '16rem' : '0',
                  transition: 'margin-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDropdown(!showDropdown);
                    }}
                    className={`w-full flex items-center justify-between bg-white border rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                      showDropdown 
                        ? 'border-blue-400 shadow-md bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-3 text-gray-500" />
                      <div>
                        <div className={`font-medium transition-colors duration-300 ${
                          showDropdown ? 'text-blue-800' : 'text-gray-800'
                        }`}>
                          {selectedModule ? selectedModule.title : 'Choose a module...'}
                        </div>
                        {selectedModule && (
                          <div className={`text-sm mt-1 transition-colors duration-300 ${
                            showDropdown ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {selectedModule.goals.totalCount} goals • {selectedModule.goals.progressPercentage}% complete
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-all duration-300 ${
                      showDropdown 
                        ? 'transform rotate-180 text-blue-600' 
                        : 'text-gray-400'
                    }`} />
                  </button>
                  
                  {showDropdown && (
                    <>
                      {/* Backdrop to capture clicks */}
                      <div 
                        className="fixed inset-0" 
                        style={{ zIndex: 9998 }}
                        onClick={() => setShowDropdown(false)}
                      />
                      <div 
                        className="dropdown-menu absolute w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
                        style={{ 
                          zIndex: 99999,
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          animation: 'slideDown 0.2s ease-out'
                        }}
                      >
                        {enrolledModules.map((module) => (
                          <button
                            type="button"
                            key={module.id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleModuleSelect(module);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 focus:bg-blue-50 focus:outline-none hover:shadow-sm"
                          >
                            <div className="font-medium text-gray-800">{module.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Course: {module.courseTitle}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex space-x-4 text-xs">
                                <span className="text-blue-600">{module.goals.totalCount} goals</span>
                                <span className="text-green-600">{module.goals.completedCount} completed</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {module.goals.progressPercentage}% complete
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Selected Module Goals */}
            {selectedModule && (
              <div className={`glass-effect p-6 rounded-xl shadow-lg mb-8
                  transform ${isMounted ? 'goal-card-animated' : 'opacity-0 scale-95'}`}
                  style={{ animationDelay: '0.3s' }}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                      <Target className="w-7 h-7 mr-3 text-green-500" />
                      {selectedModule.title} Goals
                    </h2>
                    <p className="text-gray-600 mt-1">{selectedModule.description}</p>
                  </div>
                  
                  {/* Goal Type Tabs */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('predefined')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        activeTab === 'predefined'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      📚 Predefined Goals
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ai_suggested')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        activeTab === 'ai_suggested'
                          ? 'bg-white text-purple-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      🤖 AI Suggested
                    </button>
                  </div>
                </div>

                {/* Module Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Module Progress</span>
                    <span className="text-sm text-gray-600">
                      {selectedModule.goals.completedCount} of {selectedModule.goals.totalCount} goals completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${selectedModule.goals.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Goals Loading */}
                {goalsLoading && (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading goals...</span>
                  </div>
                )}

                {/* Goals Content */}
                {!goalsLoading && moduleGoals && (
                  <div className="space-y-6">
                    {/* Predefined Goals Tab */}
                    {activeTab === 'predefined' && (
                      <div>
                        {moduleGoals.goals.predefined.length > 0 ? (
                          <>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                              Predefined Goals ({moduleGoals.goals.predefined.length})
                            </h3>
                            <div className="space-y-3">
                              {moduleGoals.goals.predefined.map((goal, index) => (
                                <div
                                  key={goal.id}
                                  className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-white"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          toggleGoalCompletion(goal.id, 'predefined');
                                        }}
                                        className="mt-1 text-green-600 hover:text-green-700 transition-colors"
                                      >
                                        {goal.progress.completed ? (
                                          <CheckCircle className="w-6 h-6" />
                                        ) : (
                                          <Circle className="w-6 h-6" />
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <h4 className={`font-semibold ${
                                          goal.progress.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                                        }`}>
                                          {goal.title}
                                        </h4>
                                        <p className={`text-sm mt-1 ${
                                          goal.progress.completed ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                          {goal.description}
                                        </p>
                                        <div className="flex items-center space-x-4 mt-2">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                                            {goal.priority} priority
                                          </span>
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(goal.difficulty)}`}>
                                            {goal.difficulty}
                                          </span>
                                          {goal.estimatedHours && (
                                            <span className="flex items-center text-xs text-gray-500">
                                              <Clock className="w-3 h-3 mr-1" />
                                              {goal.estimatedHours}h
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No Predefined Goals</h3>
                            <p className="text-gray-500">
                              This module doesn't have any predefined goals yet.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Suggested Goals Tab */}
                    {activeTab === 'ai_suggested' && (
                      <div>
                        {aiSuggestedGoals.length > 0 ? (
                          <>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                              <Zap className="w-5 h-5 mr-2 text-purple-500" />
                              AI Suggested Goals ({aiSuggestedGoals.length})
                            </h3>
                            <div className="space-y-3">
                              {aiSuggestedGoals.map((goal, index) => (
                                <div
                                  key={goal.id}
                                  className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-gradient-to-r from-purple-50 to-blue-50"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Toggle completion for AI suggested goals
                                          // You might want to add a similar function for these goals
                                        }}
                                        className="mt-1 text-purple-600 hover:text-purple-700 transition-colors"
                                      >
                                        {goal.completed ? (
                                          <CheckCircle className="w-6 h-6" />
                                        ) : (
                                          <Circle className="w-6 h-6" />
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <h4 className={`font-semibold ${
                                          goal.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                                        }`}>
                                          {goal.goal}
                                        </h4>
                                        <div className="flex items-center space-x-4 mt-2">
                                          <span className="flex items-center text-xs text-purple-600">
                                            <Star className="w-3 h-3 mr-1" />
                                            AI Suggested from Repeat Page
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            Added: {new Date(goal.createdAt?.toDate?.() || goal.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No AI Suggested Goals</h3>
                            <p className="text-gray-500 mb-4">
                              No AI-generated goals found for this module from the repeat page.
                            </p>
                            <p className="text-sm text-gray-400">
                              AI-suggested goals are created when you use the repeat preparation feature.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* No Modules State */}
            {enrolledModules.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No Enrolled Modules</h3>
                <p className="text-gray-500">
                  You're not enrolled in any modules yet. Please contact your administrator to get enrolled in courses.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
