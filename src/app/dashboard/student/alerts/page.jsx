"use client";
import { useState, useEffect } from "react";

export default function RiskAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation on mount
    setIsMounted(true);
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    // Dummy data — connect to backend risk engine later
    const data = [
      { moduleName: "Database Management", riskLevel: "medium", message: "Your recent assessments are below 60%. Focus more on normalization concepts." },
      { moduleName: "Cybersecurity", riskLevel: "high", message: "You are at high risk. Immediate attention required on cryptography & access control topics." },
      { moduleName: "Programming Fundamentals", riskLevel: "low", message: "Good progress! Consider reviewing advanced data structures for an edge." },
      { moduleName: "Web Technologies", riskLevel: "medium", message: "Some recent exercises indicate a need to strengthen your understanding of front-end frameworks." },
      { moduleName: "Algorithms", riskLevel: "high", message: "Critical: Performance in sorting algorithms is significantly low. Seek mentor support." },
      { moduleName: "Operating Systems", riskLevel: "low", message: "Consistent performance. Keep practicing with system calls." },
      { moduleName: "Data Science", riskLevel: "medium", message: "Your understanding of statistical modeling needs improvement. Review regression analysis." },
      { moduleName: "Networking", riskLevel: "low", message: "Solid grasp on network protocols. Stay updated with new security threats." },
      { moduleName: "Mobile Development", riskLevel: "high", message: "Urgent: Project submission is overdue and no significant progress is recorded." },
      { moduleName: "Cloud Computing", riskLevel: "medium", message: "Challenges with cloud deployment. Focus on containerization practices." },
    ];
    setAlerts(data);
  };

  // Helper to determine risk badge gradient
  const getRiskGradient = (risk) => {
    if (risk === "low") return "bg-gradient-to-br from-emerald-500 to-green-600";
    if (risk === "medium") return "bg-gradient-to-br from-amber-400 to-orange-500";
    return "bg-gradient-to-br from-red-500 to-rose-600"; // High risk
  };

  // Helper to determine border color (hex) based on risk level
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

        /* Animation for individual alert cards */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .alert-card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        /* Updated: Glass-effect for white background with slight transparency */
        .glass-effect {
          background-color: rgba(255, 255, 255, 0.8); /* Predominantly white, slight transparency */
          backdrop-filter: blur(8px) saturate(180%); /* Reduced blur slightly for white */
          -webkit-backdrop-filter: blur(8px) saturate(180%); /* Safari support */
          border: 1px solid rgba(0, 0, 0, 0.08); /* Subtle border for definition */
          box-shadow: 0 5px 25px 0 rgba(0, 0, 0, 0.15); /* Lighter, but present shadow */
          transition: all 0.3s ease-in-out; /* Smooth transition for glass effect properties */
        }

        /* Updated: Hover effect for glass cards */
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

        /* Button hover effect */
        .btn-hover-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 188, 212, 0.4); /* Cyan glow */
        }

        /* Alert Dismiss Button specific hover */
        .dismiss-btn:hover {
            transform: scale(1.05);
            background-color: rgba(0, 0, 0, 0.05); /* Subtle dark background on hover */
            color: #ef4444; /* Red text on hover */
        }
      `}</style>
      <div className="main-font"> {/* Apply the main font */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4 header-font animated-entry"> {/* Changed heading color */}
          Risk Alerts
        </h1>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div> {/* Changed divider color */}

        <div className="space-y-6">
          {alerts.length > 0 ? (
            alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`glass-effect p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center
                  transform hover:scale-[1.01] transition-all duration-300
                  ${isMounted ? 'alert-card-animated' : 'opacity-0 scale-95'}`}
                style={{
                  animationDelay: `${0.2 + idx * 0.08}s`, // Staggered animation delay
                  borderLeft: `8px solid ${getRiskBorderColor(alert.riskLevel)}` // Dynamic left border color
                }}
              >
                <div className="flex-1 mb-4 sm:mb-0">
                  <h2 className="text-xl font-semibold mb-1 text-gray-800">{alert.moduleName}</h2>
                  <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold shadow-md ${getRiskGradient(alert.riskLevel)} mb-2`}>
                    {alert.riskLevel.toUpperCase()} RISK
                  </div>
                  <p className="mt-2 text-gray-700">{alert.message}</p> {/* Changed text color */}
                </div>

                <div className="flex flex-col items-center sm:items-end space-y-3">
                  <button
                    onClick={() => console.log(`Taking action on alert for ${alert.moduleName}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-full shadow-md transition-all duration-200 ease-in-out btn-hover-effect focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => console.log(`Dismissing alert for ${alert.moduleName}`)}
                    className="text-gray-600 border border-gray-300 px-3 py-1 rounded-full text-sm transition-all duration-200 ease-in-out dismiss-btn hover:text-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={`glass-effect p-6 rounded-xl shadow-lg text-center text-xl font-semibold text-gray-700
                transform ${isMounted ? 'alert-card-animated' : 'opacity-0 scale-95'}`}
                style={{ animationDelay: '0.1s' }}>
              No current risks detected. Keep up the good work!
            </div>
          )}
        </div>
      </div>
    </>
  );
}
