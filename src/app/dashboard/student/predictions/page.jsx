"use client";
import { useState, useEffect } from "react";

export default function PredictionsView() {
  const [predictions, setPredictions] = useState([]);
  const [isMounted, setIsMounted] = useState(false); // For entry animations

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsMounted(true);
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    // Dummy data — will fetch from ML API later
    const data = [
      { moduleName: "Programming Fundamentals", predictedGrade: 78, riskLevel: "low" },
      { moduleName: "Database Management", predictedGrade: 54, riskLevel: "medium" },
      { moduleName: "Cybersecurity", predictedGrade: 42, riskLevel: "high" },
      { moduleName: "Web Technologies", predictedGrade: 82, riskLevel: "low" },
      { moduleName: "Computer Networks", predictedGrade: 68, riskLevel: "medium" },
      { moduleName: "Data Structures", predictedGrade: 72, riskLevel: "medium" },
      { moduleName: "Operating Systems", predictedGrade: 60, riskLevel: "medium" },
      { moduleName: "Software Engineering", predictedGrade: 90, riskLevel: "low" },
      { moduleName: "Artificial Intelligence", predictedGrade: 45, riskLevel: "high" },
      { moduleName: "Mobile App Development", predictedGrade: 75, riskLevel: "low" },
    ];
    setPredictions(data);
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
        <h1 className="text-4xl font-bold text-gray-800 mb-4 header-font animated-entry"> {/* Changed heading color */}
          Predictions
        </h1>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div> {/* Changed divider color */}

        <div className="space-y-6">
          {predictions.map((p, idx) => (
            <div
              key={idx}
              className={`glass-effect p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center
                transform hover:scale-[1.01] transition-all duration-300
                ${isMounted ? 'prediction-card-animated' : 'opacity-0 scale-95'}`}
              style={{
                animationDelay: `${0.2 + idx * 0.08}s`, // Staggered animation delay
                borderLeft: `8px solid ${getRiskBorderColor(p.riskLevel)}` // Dynamic left border color
              }}
            >
              <div className="flex-1 mb-4 sm:mb-0">
                <h2 className="text-xl font-semibold mb-1 text-gray-800">{p.moduleName}</h2>
                <p className="text-gray-700">Predicted Grade: <strong className="font-bold text-blue-700">{p.predictedGrade}%</strong></p>
              </div>

              <div className={`px-4 py-2 rounded-full text-white font-semibold shadow-md ${getRiskColor(p.riskLevel)}`}>
                {p.riskLevel.toUpperCase()} RISK
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
