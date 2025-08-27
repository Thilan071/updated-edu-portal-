"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { goalsAPI } from "../../../../lib/apiClient";

export default function GoalsTracker() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingGoal, setAddingGoal] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsMounted(true);
    if (session?.user) {
      fetchGoals();
    }
  }, [session]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await goalsAPI.getAll();
      setGoals(response.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = async (index) => {
    const goal = goals[index];
    try {
      await goalsAPI.toggle(goal.id, goal.completed);
      const updated = [...goals];
      updated[index].completed = !updated[index].completed;
      setGoals(updated);
    } catch (error) {
      console.error('Error toggling goal:', error);
      setError('Failed to update goal. Please try again.');
    }
  };

  const addGoal = async () => {
    if (!newGoal.trim()) return; // Prevent adding empty goals
    
    try {
      setAddingGoal(true);
      setError(null);
      const response = await goalsAPI.add({ goal: newGoal.trim() });
      setGoals([response.goal, ...goals]); // Add new goal to the beginning
      setNewGoal("");
    } catch (error) {
      console.error('Error adding goal:', error);
      setError('Failed to add goal. Please try again.');
    } finally {
      setAddingGoal(false);
    }
  };



  const totalCompleted = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const completionRate = totalGoals === 0 ? 0 : Math.round((totalCompleted / totalGoals) * 100);

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
      `}</style>
      <div className="main-font"> {/* Apply the main font */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-gray-800 header-font animated-entry"> {/* Changed heading color */}
            My Goals
          </h1>
        </div>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div> {/* Changed divider color */}

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
            <span className="ml-3 text-gray-600">Loading goals...</span>
          </div>
        )}

        {/* Content - Only show when not loading */}
        {!loading && (
          <>
            {/* Overall Completion Section */}
            <div className={`glass-effect p-6 rounded-xl shadow-lg mb-8
                transform ${isMounted ? 'goal-card-animated' : 'opacity-0 scale-95'}`}
                style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Overall Completion</h2>
              <div className="w-full bg-gray-300 rounded-full h-6 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 h-6 rounded-full text-white font-bold text-center flex items-center justify-center progress-bar-animated"
                  style={{ width: `${completionRate}%`, '--progress-width': `${completionRate}%` }}
                >
                  {completionRate > 5 ? `${completionRate}%` : ''} {/* Only show percentage if bar is wide enough */}
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                You have completed <span className="font-semibold text-emerald-600">{totalCompleted}</span> out of <span className="font-semibold text-blue-700">{totalGoals}</span> goals.
              </p>
            </div>

            {/* Add New Goal Section */}
            <div className={`glass-effect p-6 rounded-xl shadow-lg mb-8
                transform ${isMounted ? 'goal-card-animated' : 'opacity-0 scale-95'}`}
                style={{ animationDelay: '0.2s' }}>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Goal</h2>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !addingGoal && newGoal.trim() && addGoal()}
                  className="flex-1 border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter new goal..."
                  disabled={addingGoal}
                />
                <button
                  onClick={addGoal}
                  disabled={addingGoal || !newGoal.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 ease-in-out btn-hover-effect focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {addingGoal ? 'Adding...' : 'Add Goal'}
                </button>
              </div>
            </div>

            {/* Goals List */}
            {goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((g, idx) => (
                  <div
                    key={g.id || idx}
                    className={`glass-effect p-4 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center
                      transform hover:scale-[1.01] transition-all duration-300
                      ${isMounted ? 'goal-card-animated' : 'opacity-0 scale-95'}`}
                    style={{ animationDelay: `${0.3 + idx * 0.07}s` }} // Staggered animation for each goal
                  >
                    <span className={`flex-1 text-gray-800 text-lg ${g.completed ? 'line-through text-gray-500' : ''}`}>
                      {g.goal}
                    </span>
                    <button
                      onClick={() => toggleGoal(idx)}
                      className={`px-4 py-2 rounded-lg text-white font-semibold shadow-md transition-all duration-200 ease-in-out btn-hover-effect ${g.completed ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {g.completed ? "Completed" : "Mark Done"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  No goals yet. Start by adding your first goal!
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
