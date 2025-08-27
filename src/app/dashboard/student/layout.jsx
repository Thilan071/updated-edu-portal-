"use client";

import { useState, useEffect } from "react";
import FloatingChatbot from "@/components/FloatingChatbot";

const NavIcon = ({ children }) => (
  <span className="inline-flex items-center justify-center w-6 h-6 mr-3">
    {children}
  </span>
);

export default function StudentDashboardLayout({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      // If you add a server route later, this will clear cookies/session.
      await fetch("/api/logout", { method: "POST" }).catch(() => {});
    } finally {
      // Always navigate away even if /api/logout doesn’t exist.
      window.location.href = "/";
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Open+Sans:wght@300;400;500;600&display=swap');
        body { font-family: 'Open Sans', sans-serif; background: linear-gradient(135deg, #2B3C57 0%, #1A2840 100%); }
        .header-font { font-family: 'Outfit', sans-serif; }
        @keyframes fadeIn { from { opacity:0; transform: translateY(20px);} to { opacity:1; transform: translateY(0);} }
        @keyframes slideInLeft { from { transform: translateX(-100%); opacity:0;} to { transform: translateX(0); opacity:1;} }
        @keyframes slideInRight { from { transform: translateX(100%); opacity:0;} to { transform: translateX(0); opacity:1;} }
        @keyframes subtleScale { 0%{transform:scale(1);} 50%{transform:scale(1.02);} 100%{transform:scale(1);} }
        @keyframes logoItemPulse { 0%{transform:scale(1);} 50%{transform:scale(1.03); text-shadow:0 0 6px rgba(255,255,255,.3);} 100%{transform:scale(1);} }
        @keyframes blob { 0%{transform:translate(0,0) scale(1);} 33%{transform:translate(30px,-50px) scale(1.1);} 66%{transform:translate(-20px,20px) scale(.9);} 100%{transform:translate(0,0) scale(1);} }
        .glass-effect { background-color: rgba(255,255,255,.08); backdrop-filter: blur(15px) saturate(200%); -webkit-backdrop-filter: blur(15px) saturate(200%); border:1px solid rgba(255,255,255,.1); box-shadow:0 10px 40px rgba(0,0,0,.4); }
        .logo-container { background-color: rgba(255,255,255,.15); backdrop-filter: blur(10px) saturate(180%); -webkit-backdrop-filter: blur(10px) saturate(180%); border:1px solid rgba(255,255,255,.08); box-shadow:0 4px 20px rgba(0,0,0,.2); padding:1rem 1.5rem; transition:none; }
        .animated-entry { animation: fadeIn .8s ease-out forwards; }
        .sidebar-animated { animation: slideInLeft .8s ease-out forwards; }
        .main-animated { animation: slideInRight .8s ease-out forwards; }
        .nav-link-hover:hover { animation: subtleScale .3s ease-in-out forwards; }
        .logo-container:hover img, .logo-container:hover span { animation: logoItemPulse .8s ease-in-out infinite; }
        @keyframes rotateGlow { 0%{ transform:translate(-50%,-50%) rotate(0);} 100%{ transform:translate(-50%,-50%) rotate(360deg);} }
        .shimmer-wrapper { position:relative; border-radius:2rem; padding:2px; }
        .shimmer-wrapper::before {
          content:''; position:absolute; top:50%; left:50%; width:calc(100% + 40px); height:calc(100% + 40px);
          background: conic-gradient(from 0deg, transparent 0%, transparent 20%, rgba(128,203,255,.8) 30%, rgba(0,128,255,.8) 40%, transparent 50%, transparent 70%, rgba(128,203,255,.8) 80%, rgba(0,128,255,.8) 90%, transparent 100%);
          border-radius:50%; animation: rotateGlow 15s linear infinite; z-index:-1; filter: blur(20px); pointer-events:none;
        }
      `}</style>

      <div className="min-h-screen flex flex-col lg:flex-row p-4 lg:p-8 shimmer-wrapper relative">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-blue-700 to-indigo-800 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob lg:w-96 lg:h-96"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob animation-delay-2000 lg:w-96 lg:h-96"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-teal-600 to-sky-700 rounded-full mix-blend-screen filter blur-xl opacity-60 animate-blob animation-delay-4000 lg:w-96 lg:h-96"></div>

        {/* Sidebar */}
        <aside
          className={`w-full lg:w-64 mb-4 lg:mb-0 lg:mr-8 text-white flex flex-col rounded-2xl glass-effect
            transform ${isMounted ? 'sidebar-animated' : 'opacity-0 scale-95'} transition-transform`}
          style={{ animationDelay: '0.2s' }}
        >
          <div className="text-3xl font-extrabold text-center lg:text-left flex items-center justify-center lg:justify-start space-x-3 cursor-pointer header-font logo-container rounded-t-2xl">
            <img src="/eduboost.png" alt="EduBoost Logo" className="h-15 w-15 rounded-full shadow-lg" />
            <span>EduBoost</span>
          </div>

          <nav className="flex-1 p-4 space-y-3 text-lg">
            {[
              {
                href: "/dashboard/student/profile",
                label: "Profile",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student",
                label: "Home",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/modules",
                label: "Modules",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/grades",
                label: "Grades",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/assessments",
                label: "Assessments",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/repeat",
                label: "Repeat",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 1l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/planner",
                label: "Planner",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/goals",
                label: "Goals",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/predictions",
                label: "Predictions",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/alerts",
                label: "Alerts",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                  </svg>
                ),
              },
              {
                href: "/dashboard/student/health",
                label: "Health",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5a3 3 0 1 0 0 6A3 3 0 0 0 12 5"/><path d="M12 12a3 3 0 1 0 0 6A3 3 0 0 0 12 12"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M22 10h-2c-2.2 0  -4-1.8-4-4V4"/><path d="M2 14h2c2.2 0 4 1.8 4 4v2"/><path d="M10 22v-2c0-2.2 1.8-4 4-4h2"/><path d="M14 2h2c2.2 0 4 1.8 4 4v2"/>
                  </svg>
                ),
              },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center p-3 rounded-xl transition-all duration-300 ease-in-out hover:bg-white/10 hover:shadow-xl transform nav-link-hover"
              >
                <NavIcon>{item.icon}</NavIcon>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="p-4 pt-0">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full bg-white/90 text-blue-700 font-semibold py-2.5 rounded-xl hover:bg-white transition disabled:opacity-60"
              title="Log out"
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
            <div className="mt-3 text-center text-sm text-white/60 border-t border-white/10 pt-3">
              © EduBoost 2025
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main
          className={`flex-1 p-6 lg:p-8 rounded-2xl glass-effect overflow-auto
            transform ${isMounted ? 'main-animated' : 'opacity-0 scale-95'} transition-transform`}
          style={{ animationDelay: '0.4s' }}
        >
          {children}
        </main>

        {/* Floating Chatbot */}
        <FloatingChatbot />
      </div>
    </>
  );
}
