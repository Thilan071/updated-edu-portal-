'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FloatingChatbot from '@/components/FloatingChatbot';
import {
  LayoutDashboard, UserRoundCog, BookOpen, Wrench, TrendingUp,
  Repeat, Bell, ChartBar, FileSearch, Settings, Menu,
} from 'lucide-react';

const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Open+Sans:wght@300;400;500;600&display=swap');

    body {
      font-family: 'Open Sans', sans-serif;
      background: linear-gradient(135deg, rgb(55,100,124) 0%, #1A2840 100%);
    }
    .header-font { font-family: 'Outfit', sans-serif; }
    .main-font { font-family: 'Open Sans', sans-serif; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .animated-entry { animation: fadeIn 0.8s ease-out forwards; }
    .sidebar-animated { animation: slideInLeft 0.8s ease-out forwards; }

    .glass-effect {
      background-color: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(15px) saturate(200%);
      -webkit-backdrop-filter: blur(15px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 10px 40px 0 rgba(0,0,0,0.4);
    }
  `}</style>
);

const links = [
  { name: 'Dashboard Overview', href: '/dashboard/admin',                      icon: <LayoutDashboard size={20} /> },
  { name: 'User Management',    href: '/dashboard/admin/user-management',      icon: <UserRoundCog size={20} /> },
  { name: 'Module Management',  href: '/dashboard/admin/module-management',    icon: <BookOpen size={20} /> },
  { name: 'Assessment Management', href: '/dashboard/admin/assessment-management', icon: <Wrench size={20} /> },
  { name: 'Participation Oversight', href: '/dashboard/admin/participation',   icon: <TrendingUp size={20} /> },
  { name: 'Repeated Module Tracking', href: '/dashboard/admin/repeated-module-tracking', icon: <Repeat size={20} /> },
  { name: 'Notification Hub',   href: '/dashboard/admin/notifications',        icon: <Bell size={20} /> },
  { name: 'Analytics & Reports',href: '/dashboard/admin/analytics',            icon: <ChartBar size={20} /> },
  { name: 'System Logs & Audit',href: '/dashboard/admin/audit-logs',           icon: <FileSearch size={20} /> },
  { name: 'Settings',           href: '/dashboard/admin/settings',             icon: <Settings size={20} /> },
];

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // mobile
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      // Clear any session/cookies
      await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    } finally {
      // Always navigate away even if /api/logout doesn't exist
      window.location.href = '/';
    }
  };

  return (
    <>
      <GlobalStyles />
      <div className="flex min-h-screen">
        {/* Mobile overlay */}
        {isOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`h-screen sticky top-0 p-4 transition-all duration-300 flex flex-col glass-effect rounded-2xl m-4 z-40
            ${collapsed ? 'w-20' : 'w-72'}
            ${mounted ? 'sidebar-animated' : 'opacity-0'}
            ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
          style={{ animationDelay: '0.2s' }}
        >
          {/* Logo & Collapse */}
          <div className="flex justify-between items-center mb-6">
            {!collapsed && (
              <div className="text-2xl font-extrabold flex items-center space-x-2 header-font">
                <img src="/eduboost.png" alt="EduBoost Logo" className="h-10 w-10" />
                <span className="text-white">EduBoost Admin</span>
              </div>
            )}
            <button
              onClick={() => { setCollapsed(c => !c); setIsOpen(false); }}
              className="text-white opacity-80 hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-white/10"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2">
              {links.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`w-full flex items-center gap-4 rounded-xl px-4 py-3 text-white transition-all duration-200 ${
                        isActive ? 'bg-white/20 text-white font-semibold' : 'hover:bg-white/10'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                      title={collapsed ? item.name : undefined}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon}
                      {!collapsed && <span className="flex-1 whitespace-nowrap">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="mt-auto">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full bg-white/90 text-blue-700 font-semibold py-2.5 rounded-xl hover:bg-white transition disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
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
            
            <div className={`text-center text-xs text-white/60 ${collapsed ? 'text-center' : ''}`}>
              {collapsed ? 'EB' : `© EduBoost ${new Date().getFullYear()}`}
            </div>
          </div>
        </aside>

        {/* Main content with mobile header */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="md:hidden glass-effect rounded-2xl p-3 mb-4 flex items-center justify-between shadow-sm">
            <button className="p-1 rounded hover:bg-white/10 text-white" onClick={() => setIsOpen(true)}>
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-white ml-4 flex-1">Admin Panel</h2>
            <img src="/eduboost.png" alt="EduBoost Logo" className="h-10 w-10" />
          </div>

          {children}
        </main>

        {/* Floating Chatbot */}
        <FloatingChatbot />
      </div>
    </>
  );
}
