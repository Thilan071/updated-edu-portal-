"use client";
import { useState, useEffect } from "react";

export default function PredictionsView() {
  const [predictions, setPredictions] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    setIsMounted(true);
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔮 Fetching ML predictions...');
      const response = await fetch('/api/student/predictions', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch predictions: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Received predictions:', data);

      if (data.predictions && Array.isArray(data.predictions)) {
        setPredictions(data.predictions);
        setSummary(data.summary);
      } else {
        throw new Error('Invalid predictions data format');
      }

    } catch (err) {
      console.error('❌ Error fetching predictions:', err);
      setError(err.message);
      
      // Fallback to dummy data for development
      const fallbackData = [
        { moduleName: "Programming Fundamentals", predictedGrade: 78, riskLevel: "low", confidence: 0.85 },
        { moduleName: "Database Management", predictedGrade: 54, riskLevel: "medium", confidence: 0.72 },
        { moduleName: "Cybersecurity", predictedGrade: 42, riskLevel: "high", confidence: 0.89 },
        { moduleName: "Web Technologies", predictedGrade: 82, riskLevel: "low", confidence: 0.76 },
        { moduleName: "Computer Networks", predictedGrade: 68, riskLevel: "medium", confidence: 0.68 },
      ];
      setPredictions(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === "low") return "bg-gradient-to-br from-emerald-500 to-green-600";
    if (risk === "medium") return "bg-gradient-to-br from-amber-400 to-orange-500";
    return "bg-gradient-to-br from-red-500 to-rose-600"; // High risk
  };

  const getRiskBorderColor = (risk) => {
    if (risk === "low") return "#10B981"; // Emerald-500
    if (risk === "medium") return "#FBBF24"; // Amber-400
    return "#EF4444"; // Red-500
  };

  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="main-font flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ML predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        /* Importing new fonts */
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');

        /* Animation for individual prediction cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .prediction-card-animated {
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
      `}</style>
      <div className="main-font"> {/* Apply the main font */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 header-font animated-entry">
              AI Performance Predictions
            </h1>
            <p className="text-gray-600 mt-2">
              Machine learning-powered predictions based on your current performance
            </p>
          </div>
          
          {summary && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-red-600 font-medium">{summary.highRisk}</span> High Risk
                </div>
                <div>
                  <span className="text-amber-600 font-medium">{summary.mediumRisk}</span> Medium Risk
                </div>
                <div>
                  <span className="text-green-600 font-medium">{summary.lowRisk}</span> Low Risk
                </div>
                <div>
                  <span className="text-blue-600 font-medium">{Math.round(summary.avgConfidence * 100)}%</span> Avg Confidence
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Prediction Error</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <p className="text-red-600 text-sm">Showing fallback data for demonstration.</p>
              </div>
            </div>
          </div>
        )}

        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div>

        {predictions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Modules Found</h3>
            <p className="text-gray-500">You don't seem to be enrolled in any modules yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {predictions.map((p, idx) => (
              <div
                key={p.moduleId || idx}
                className={`glass-effect p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center
                  transform hover:scale-[1.01] transition-all duration-300
                  ${isMounted ? 'prediction-card-animated' : 'opacity-0 scale-95'}`}
                style={{
                  animationDelay: `${0.2 + idx * 0.08}s`,
                  borderLeft: `8px solid ${getRiskBorderColor(p.riskLevel)}`
                }}
              >
                <div className="flex-1 mb-4 sm:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold text-gray-800">{p.moduleName}</h2>
                    {p.fallback && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Rule-based
                      </span>
                    )}
                  </div>
                  
                  {p.courseTitle && (
                    <p className="text-sm text-gray-500 mb-2">{p.courseTitle}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>
                      Predicted Grade: <strong className="font-bold text-blue-700">{p.predictedGrade}%</strong>
                    </span>
                    
                    {p.currentPerformance && (
                      <>
                        <span>Current Avg: {p.currentPerformance.avgAssessment}%</span>
                        <span>GPA: {p.currentPerformance.gpa}</span>
                      </>
                    )}
                  </div>
                  
                  {p.confidence && (
                    <div className="mt-2">
                      <span className={`text-xs ${getConfidenceColor(p.confidence)}`}>
                        {getConfidenceText(p.confidence)} ({Math.round(p.confidence * 100)}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={`px-4 py-2 rounded-full text-white font-semibold shadow-md ${getRiskColor(p.riskLevel)}`}>
                    {p.riskLevel.toUpperCase()} RISK
                  </div>
                  
                  {p.riskScore && (
                    <span className="text-xs text-gray-500">
                      Risk Score: {Math.round(p.riskScore * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Last updated info */}
        {summary?.lastUpdated && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Last updated: {new Date(summary.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </>
  );
}
