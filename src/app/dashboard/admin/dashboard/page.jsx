'use client';
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Users, BookOpen, Repeat, Bell, TrendingUp, AlertTriangle, MessageSquareWarning } from 'lucide-react';

// ---------- Demo Data (Hardcoded) ----------
const summaryData = [
  { title: "Total Students", count: 250, icon: <Users className="text-blue-400" size={32} /> },
  { title: "Educators", count: 15, icon: <BookOpen className="text-green-400" size={32} /> },
  { title: "Modules", count: 20, icon: <BookOpen className="text-yellow-400" size={32} /> },
  { title: "Ongoing Repeats", count: 5, icon: <Repeat className="text-purple-400" size={32} /> },
];

const participationTrend = [
  { week: "W1", participation: 78 },
  { week: "W2", participation: 82 },
  { week: "W3", participation: 76 },
  { week: "W4", participation: 85 },
  { week: "W5", participation: 88 },
];

const quickStats = [
  {
    title: "Students at Risk",
    value: 12,
    color: "text-red-400",
    icon: <AlertTriangle className="text-red-400" size={20} />
  },
  {
    title: "Unmarked Assessments",
    value: 18,
    color: "text-yellow-400",
    icon: <MessageSquareWarning className="text-yellow-400" size={20} />
  },
];

const recentNotifications = [
  {
    title: "Reminder: Module Registration Deadline",
    date: "2025-08-10",
  },
  {
    title: "New Repeat Schedule Published",
    date: "2025-08-09",
  },
  {
    title: "Mid-Sem Participation Report Available",
    date: "2025-08-08",
  },
];

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes subtleScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        
        .animated-entry {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

        .card-hover:hover {
          animation: subtleScale 0.3s ease-in-out forwards;
        }

        /* Glassmorphism effect consistent with layout.jsx */
        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
          transition: all 0.3s ease-in-out;
        }

        .glass-effect-dark:hover {
          background-color: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-5px) scale(1.01);
          box-shadow: 0 15px 50px 0 rgba(0, 0, 0, 0.5);
        }
      `}</style>
      <div className="main-font min-h-screen p-6 md:p-10 text-white">
        <header
          className={`mb-8 flex items-center opacity-0 ${isMounted ? 'animated-entry' : ''}`}
          style={{ animationDelay: '0.1s' }}
        >
          <h1 className="text-4xl font-bold flex items-center header-font">
            <TrendingUp className="w-10 h-10 mr-3 text-blue-400" />
            Dashboard Overview
          </h1>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryData.map((item, idx) => (
            <div
              key={idx}
              className={`glass-effect-dark card-hover rounded-2xl p-6 text-center transition-all duration-300 flex flex-col items-center
                ${isMounted ? 'animated-entry' : 'opacity-0 scale-95'}`}
              style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
            >
              <div className="mb-3">{item.icon}</div>
              <h2 className="text-3xl font-bold text-gray-100">
                {item.count}
              </h2>
              <p className="text-gray-400 mt-1">{item.title}</p>
            </div>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Participation % Trend */}
          <div
            className={`glass-effect-dark rounded-2xl p-6 col-span-1 lg:col-span-2 transition-all duration-300
              ${isMounted ? 'animated-entry' : 'opacity-0 scale-95'}`}
            style={{ animationDelay: `${0.6}s` }}
          >
            <h3 className="text-xl font-semibold mb-4 text-blue-400">
              Participation % Trend (Past 5 Weeks)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={participationTrend}>
                <CartesianGrid stroke="#4b5563" strokeDasharray="3 3" />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis domain={[60, 100]} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#d1d5db' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Line
                  type="monotone"
                  dataKey="participation"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Students at Risk & Unmarked Assessments */}
          <div className="flex flex-col gap-6">
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className={`glass-effect-dark card-hover p-6 rounded-2xl flex flex-col justify-center transition-all duration-300
                  ${isMounted ? 'animated-entry' : 'opacity-0 scale-95'}`}
                style={{ animationDelay: `${0.7 + index * 0.1}s` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <h4 className="text-lg font-medium text-gray-300">
                    {stat.title}
                  </h4>
                </div>
                <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div
          className={`glass-effect-dark rounded-2xl p-6 transition-all duration-300
            ${isMounted ? 'animated-entry' : 'opacity-0 scale-95'}`}
          style={{ animationDelay: '0.9s' }}
        >
          <h3 className="text-xl font-semibold mb-4 text-blue-400">
            Recent Notifications Sent
          </h3>
          <ul className="space-y-3">
            {recentNotifications.map((note, idx) => (
              <li
                key={idx}
                className="border-b border-white/10 last:border-b-0 pb-3 text-sm text-gray-300 flex justify-between"
              >
                <span className="font-medium">{note.title}</span>
                <span className="text-gray-500 text-xs">({note.date})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}