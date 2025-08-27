'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import FloatingChatbot from '@/components/FloatingChatbot';

// Inline SVG menu icon (no external icon deps)
const MenuIcon = ({ size = 24, strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

const navItems = [
  { label: 'Dashboard',          path: '/dashboard/educator' },
  { label: 'Student Details',    path: '/dashboard/educator/students-details' },
  { label: 'Student Progress',   path: '/dashboard/educator/student-progress' },
  { label: 'Assessments',        path: '/dashboard/educator/assessments' },
  { label: 'AI Marking Tool',    path: '/dashboard/educator/ai-marking' },
  { label: 'Repeated Modules',   path: '/dashboard/educator/repeated-modules' },
  { label: 'Participation Logs', path: '/dashboard/educator/participation' },
  { label: 'Notifications',      path: '/dashboard/educator/notifications' },
];

export default function EducatorDashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setIsMounted(true), []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear any local storage or session data
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Open+Sans:wght@300;400;500;600&display=swap');

        body {
          font-family: 'Open Sans', sans-serif;
          background: linear-gradient(135deg, #2B3C57 0%, #1A2840 100%);
        }
        .header-font { font-family: 'Outfit', sans-serif; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animated-entry { animation: fadeIn 0.8s ease-out forwards; }
        .sidebar-animated { animation: slideInLeft 0.8s ease-out forwards; }

        .glass-effect {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
        }
        .logo-container {
          background-color: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px) saturate(180%);
          -webkit-backdrop-filter: blur(10px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.2);
          transition: none;
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`h-screen sticky top-0 p-4 transition-all duration-300 flex flex-col glass-effect rounded-2xl m-4
            ${collapsed ? 'w-20' : 'w-72'}
            ${isMounted ? 'sidebar-animated' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: '0.2s' }}
        >
          {/* Logo + Collapse */}
          <div className="flex justify-between items-center mb-6">
            {!collapsed && (
              <div className="text-3xl font-extrabold flex items-center space-x-2 header-font">
                <img src="/eduboost.png" alt="EduBoost Logo" className="h-10 w-10" />
                <span className="text-white">EduBoost</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="text-white opacity-80 hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-white/10"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <MenuIcon size={24} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <li key={item.path}>
                    <Link href={item.path} aria-current={isActive ? 'page' : undefined}>
                      <div
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 text-white transition-all duration-200
                          ${isActive ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10'}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="text-lg">
                          {collapsed ? item.label.charAt(0) : item.label}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="mt-auto p-4">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full bg-white/90 text-blue-700 font-semibold py-2.5 rounded-xl hover:bg-white transition disabled:opacity-60 flex items-center justify-center gap-2"
              title="Log out"
            >
              {!collapsed && (
                <>
                  {loggingOut ? "Logging out..." : "Log out"}
                </>
              )}
              {collapsed && (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              )}
            </button>
            <div className={`mt-3 text-center text-xs text-white/60 border-t border-white/10 pt-3 ${collapsed ? 'text-center' : ''}`}>
              {collapsed ? 'EB' : '© EduBoost 2025'}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>

        {/* Floating Chatbot */}
        <FloatingChatbot />
      </div>
    </>
  );
}
