"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function HealthCheck() {
  const { data: session } = useSession();
  const [mood, setMood] = useState("");
  const [stress, setStress] = useState("");
  const [procrastination, setProcrastination] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false); // For entry animations

  useEffect(() => {
    setIsMounted(true); // Trigger fade-in animation on mount
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mood,
          stress,
          procrastination,
          sleepHours: parseFloat(sleepHours)
        }),
      });

      // Check if response has content before parsing JSON
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit health check');
      }

      console.log('=== FRONTEND RECEIVED DATA ===');
      console.log('Full response:', JSON.stringify(data, null, 2));
      console.log('==============================');
      
      setRecommendations(data.data);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Glass-effect for white background with slight transparency */
        .glass-effect {
          background-color: rgba(255, 255, 255, 0.8); /* Predominantly white, slight transparency */
          backdrop-filter: blur(8px) saturate(180%); /* Reduced blur slightly for white */
          -webkit-backdrop-filter: blur(8px) saturate(180%); /* Safari support */
          border: 1px solid rgba(0, 0, 0, 0.08); /* Subtle border for definition */
          box-shadow: 0 5px 25px 0 rgba(0, 0, 0, 0.15); /* Lighter, but present shadow */
          transition: all 0.3s ease-in-out; /* Smooth transition for glass effect properties */
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

        /* Button hover effect (consistent with other components) */
        .btn-hover-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4); /* Cyan glow */
        }

        /* Animation for form/submission message */
        @keyframes formFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .form-animated {
            animation: formFadeIn 0.7s ease-out forwards;
            animation-delay: 0.8s; /* Delay after header and divider */
        }
      `}</style>
      <div className="main-font"> {/* Apply the main font for overall consistency */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4 header-font animated-entry">
          Health Check
        </h1>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className={`glass-effect p-8 rounded-xl shadow-lg space-y-6 form-animated`}>
            <div>
              <label htmlFor="mood-select" className="font-semibold text-gray-800 mb-2 block">Mood:</label>
              <select
                id="mood-select"
                className="block w-full border border-gray-300 p-3 rounded-lg mt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                required
              >
                <option value="">Select your mood</option>
                <option value="Happy">😄 Happy</option>
                <option value="Neutral">😐 Neutral</option>
                <option value="Stressed">😓 Stressed</option>
                <option value="Sad">😔 Sad</option>
              </select>
            </div>

            <div>
              <label htmlFor="stress-input" className="font-semibold text-gray-800 mb-2 block">Stress Level (1-5):</label>
              <input
                id="stress-input"
                type="number"
                min="1"
                max="5"
                className="block w-full border border-gray-300 p-3 rounded-lg mt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={stress}
                onChange={(e) => setStress(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="procrastination-input" className="font-semibold text-gray-800 mb-2 block">Procrastination Level (1-5):</label>
              <input
                id="procrastination-input"
                type="number"
                min="1"
                max="5"
                className="block w-full border border-gray-300 p-3 rounded-lg mt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={procrastination}
                onChange={(e) => setProcrastination(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="sleep-input" className="font-semibold text-gray-800 mb-2 block">Average Sleep Hours (per day):</label>
              <input
                id="sleep-input"
                type="number"
                min="0"
                max="24"
                className="block w-full border border-gray-300 p-3 rounded-lg mt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 ease-in-out btn-hover-effect focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Submit Health Check'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Success Message */}
            <div className={`glass-effect p-6 rounded-xl shadow-lg text-center bg-emerald-100 text-emerald-700 form-animated`}>
              <h2 className="text-2xl font-bold mb-4">Health Check Complete! 🎉</h2>
              <p className="text-lg">Your personalized health recommendations are ready.</p>
            </div>

            {/* Recommendations Display */}
            {recommendations && (
              <div className="glass-effect p-8 rounded-xl shadow-lg form-animated">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Personalized Recommendations</h3>
                
                {/* Input Analysis */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-800 mb-3">Analysis Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Stress Level:</strong> {recommendations.input_analysis.stress_category}</div>
                    <div><strong>Sleep Quality:</strong> {recommendations.input_analysis.sleep_quality}</div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="mb-6 p-4 bg-green-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-800 mb-3">Recommended Daily Targets</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-2xl font-bold text-blue-600">{recommendations.detailed_metrics?.study_hours || 'N/A'}h</div>
                      <div className="text-gray-600">Study Hours</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-2xl font-bold text-green-600">{recommendations.detailed_metrics?.exercise_minutes || 'N/A'}min</div>
                      <div className="text-gray-600">Exercise</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-2xl font-bold text-purple-600">{recommendations.detailed_metrics?.sleep_hours || 'N/A'}h</div>
                      <div className="text-gray-600">Sleep Target</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-2xl font-bold text-cyan-600">{recommendations.detailed_metrics?.water_liters || 'N/A'}L</div>
                      <div className="text-gray-600">Water Intake</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-2xl font-bold text-orange-600">{recommendations.detailed_metrics?.meditation_minutes || 'N/A'}min</div>
                      <div className="text-gray-600">Meditation</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-2xl font-bold text-red-600">{recommendations.detailed_metrics?.screen_limit || 'N/A'}h</div>
                      <div className="text-gray-600">Screen Limit</div>
                    </div>
                  </div>
                </div>

                {/* Personalized Plans */}
                <div className="space-y-4">
                  {/* Study Plan */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">📚 Study Plan</h4>
                    <ul className="space-y-2">
                      {recommendations.recommendations.study_plan && recommendations.recommendations.study_plan.length > 0 ? (
                        recommendations.recommendations.study_plan.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">No study recommendations available</li>
                      )}
                    </ul>
                  </div>

                  {/* Physical Plan */}
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-800 mb-3">💪 Physical Wellness Plan</h4>
                    <ul className="space-y-2">
                      {recommendations.recommendations.physical_plan && recommendations.recommendations.physical_plan.length > 0 ? (
                        recommendations.recommendations.physical_plan.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">No physical recommendations available</li>
                      )}
                    </ul>
                  </div>

                  {/* Emotional Plan */}
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-purple-800 mb-3">🧘 Emotional Wellness Plan</h4>
                    <ul className="space-y-2">
                      {recommendations.recommendations.emotional_plan && recommendations.recommendations.emotional_plan.length > 0 ? (
                        recommendations.recommendations.emotional_plan.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">No emotional recommendations available</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="mt-6 text-center">
                  <div className="inline-block p-3 bg-gray-100 rounded-lg">
                    <span className="text-sm text-gray-600">Recommendation Confidence: </span>
                    <span className="font-bold text-gray-800">{(recommendations.model_confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="text-center space-x-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setRecommendations(null);
                  setMood("");
                  setStress("");
                  setProcrastination("");
                  setSleepHours("");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 ease-in-out btn-hover-effect focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Take Another Health Check
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
