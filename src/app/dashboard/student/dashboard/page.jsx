"use client";
import { useState, useEffect } from "react";

export default function StudentHome() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // This ensures the fade-in animation runs after the component mounts
    setIsMounted(true);
  }, []);

  return (
    <>
      <style jsx>{`
        /* Importing new fonts (assuming they are already imported globally by layout) */
        /* If not, uncomment and add:
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Lato:wght@300;400;500;600&display=swap');
        */

        /* Animation for individual home cards/sections */
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .home-card-animated {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        /* Glass-effect (consistent with other components) */
        .glass-effect {
          background-color: rgba(255, 255, 255, 0.8); /* Predominantly white, slight transparency */
          backdrop-filter: blur(8px) saturate(180%); /* Reduced blur slightly for white */
          -webkit-backdrop-filter: blur(8px) saturate(180%); /* Safari support */
          border: 1px solid rgba(0, 0, 0, 0.08); /* Subtle border for definition */
          box-shadow: 0 5px 25px 0 rgba(0, 0, 0, 0.15); /* Lighter, but present shadow */
          transition: all 0.3s ease-in-out; /* Smooth transition for glass effect properties */
        }

        /* Hover effect for glass cards (consistent with other components) */
        .glass-effect:hover {
          background-color: rgba(255, 255, 255, 0.9); /* More opaque on hover */
          border-color: rgba(0, 0, 0, 0.15); /* Slightly darker border on hover */
          box-shadow: 0 8px 30px 0 rgba(0, 0, 0, 0.25); /* More pronounced shadow on hover */
        }

        /* Font classes (assuming they are defined globally by layout) */
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

      <div className="space-y-8 main-font"> {/* Apply main-font for overall consistency */}
        <h1 className="text-4xl font-bold text-gray-800 header-font animated-entry">
          Welcome to EduBoost!
        </h1>
        {/* Animated Divider */}
        <div className="w-full h-[2px] bg-blue-600 rounded-full mb-8 animated-divider"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Responsive grid */}
          <div className={`glass-effect rounded-xl shadow-lg p-6 text-center transform hover:scale-[1.01] transition-all duration-300 ${isMounted ? 'home-card-animated' : 'opacity-0 scale-95'}`} style={{ animationDelay: '0.2s' }}>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">My Modules</h2>
            <p className="text-gray-700">View your enrolled modules and current status.</p>
            <a href="/dashboard/student/modules" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
              Go to Modules &rarr;
            </a>
          </div>

          <div className={`glass-effect rounded-xl shadow-lg p-6 text-center transform hover:scale-[1.01] transition-all duration-300 ${isMounted ? 'home-card-animated' : 'opacity-0 scale-95'}`} style={{ animationDelay: '0.3s' }}>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">My Planner</h2>
            <p className="text-gray-700">Check your personalized study plan.</p>
            <a href="/dashboard/student/planner" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
              Go to Planner &rarr;
            </a>
          </div>

          <div className={`glass-effect rounded-xl shadow-lg p-6 text-center transform hover:scale-[1.01] transition-all duration-300 ${isMounted ? 'home-card-animated' : 'opacity-0 scale-95'}`} style={{ animationDelay: '0.4s' }}>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Risk Alerts</h2>
            <p className="text-gray-700">See if any module needs special attention.</p>
            <a href="/dashboard/student/predictions" className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
              View Predictions &rarr;
            </a>
          </div>
        </div>

        <div className={`glass-effect bg-gradient-to-r from-blue-600 to-cyan-700 p-8 rounded-xl text-white shadow-lg
            transform ${isMounted ? 'home-card-animated' : 'opacity-0 scale-95'}`} style={{ animationDelay: '0.5s' }}>
          <h2 className="text-2xl font-bold mb-3 header-font">AI Personalized Recommendation</h2>
          <p className="text-lg">
            Based on your current performance and recent activities, we recommend you dedicate extra study time to **Database Management** by reviewing SQL query optimization and working through practical exercises. Also, try to allocate more focus on **Computer Networks**, specifically network protocols. Your AI mentor suggests reviewing chapters on TCP/IP and subnetting this week.
          </p>
          <div className="mt-4 inline-block bg-white bg-opacity-80 hover:bg-opacity-90 text-blue-800 font-semibold py-2 px-4 rounded-full transition-all duration-200 cursor-default">
            💬 Use the chat icon at the bottom right to talk with your AI Mentor!
          </div>
        </div>
      </div>
    </>
  );
}
