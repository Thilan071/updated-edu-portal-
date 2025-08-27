// app/dashboard/admin/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingStudents, setPendingStudents] = useState([]);
  const [pendingEducators, setPendingEducators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [activeTab, setActiveTab] = useState("students");

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  async function load() {
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      // Fetch pending students
      const studentsData = await apiClient.adminAPI.getPendingStudents();
      setPendingStudents(Array.isArray(studentsData) ? studentsData : []);

      // Fetch pending educators
      const educatorsData = await apiClient.adminAPI.getPendingEducators();
      setPendingEducators(Array.isArray(educatorsData) ? educatorsData : []);
    } catch (e) {
      setErr(e.message || "Failed to load pending users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'loading') return;
    if (session && session.user?.role === 'admin') {
      load();
    }
  }, [session, status]);

  async function approveStudent(id) {
    setMsg("");
    setErr("");
    try {
      const data = await apiClient.adminAPI.approveStudent(id);
      const successMsg = data?.studentId 
        ? `Student approved successfully! Student ID: ${data.studentId}. Notification email sent.`
        : (data?.message || "Student approved");
      setMsg(successMsg);
      await load();
    } catch (e) {
      setErr(e.message || "Student approval failed");
    }
  }

  async function approveEducator(id) {
    setMsg("");
    setErr("");
    try {
      const data = await apiClient.adminAPI.approveEducator(id);
      setMsg(data?.message || "Educator approved successfully! Notification email sent.");
      await load();
    } catch (e) {
      setErr(e.message || "Educator approval failed");
    }
  }

  async function rejectUser(id, userType) {
    setMsg("");
    setErr("");
    if (!confirm(`Are you sure you want to reject this ${userType}? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiClient.adminAPI.rejectUser(id);
      setMsg(`${userType.charAt(0).toUpperCase() + userType.slice(1)} rejected and removed successfully.`);
      await load();
    } catch (e) {
      setErr(e.message || "Rejection failed");
    }
  }

  const currentData = activeTab === "students" ? pendingStudents : pendingEducators;
  const currentCount = currentData.length;

  // Show loading spinner while checking authentication
  if (status === 'loading' || !session || session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <>
      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Open+Sans:wght@300;400;500;600&display=swap');
        body { font-family: 'Open Sans', sans-serif; }
        .header-font { font-family: 'Outfit', sans-serif; }
        @keyframes blob {
          0% { transform: translate(0,0) scale(1) }
          33% { transform: translate(30px,-50px) scale(1.1) }
          66% { transform: translate(-20px,20px) scale(0.9) }
          100% { transform: translate(0,0) scale(1) }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <div className="min-h-screen">
        <main className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <img src="/eduboost.png" alt="EduBoost Logo" className="h-12 w-12 rounded-full shadow-lg" />
              <h1 className="text-3xl font-bold text-white header-font">Admin Dashboard</h1>
            </div>
            <button
              onClick={load}
              className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl text-white border border-white/20 hover:bg-white/20 transition-all duration-200 font-medium"
            >
              Refresh
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setActiveTab("students")}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === "students"
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Students ({pendingStudents.length})
                </button>
                <button
                  onClick={() => setActiveTab("educators")}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 ${
                    activeTab === "educators"
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Educators ({pendingEducators.length})
                </button>
              </nav>
            </div>
          </div>

          {msg && (
            <div className="mb-6 p-4 bg-green-500/20 backdrop-blur-xl border border-green-400/30 text-green-100 rounded-2xl">
              {msg}
            </div>
          )}
          {err && (
            <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-xl border border-red-400/30 text-red-100 rounded-2xl">
              {err}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center space-x-2 text-white/80">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span className="text-lg font-medium">Loading...</span>
              </div>
            </div>
          ) : currentCount === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <div className="text-white/60 text-lg font-medium">
                  No pending {activeTab} approvals
                </div>
                <div className="text-white/40 text-sm mt-2">
                  All {activeTab} have been processed
                </div>
              </div>
            </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">
                  Telephone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/90 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentData.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                    {u.telephone || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => activeTab === "students" ? approveStudent(u.id) : approveEducator(u.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-green-600/80 backdrop-blur-xl border border-green-500/30 hover:bg-green-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectUser(u.id, activeTab.slice(0, -1))}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-red-600/80 backdrop-blur-xl border border-red-500/30 hover:bg-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
         </div>
           )}
         </main>
       </div>
     </>
   );
}
