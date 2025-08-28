'use client';
import React, { useRef, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart2, FileText, Download, Printer, RefreshCw } from "lucide-react";
import { adminAPI } from "../../../../lib/apiClient";
import { useSession } from "next-auth/react";

// Color scheme for charts
const PIE_COLORS = ["#10b981", "#fbbf24", "#ef4444"]; // Green, Yellow, Red

export default function AnalyticsReportsPage() {
  const { data: session, status } = useSession();
  const printRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Real data state
  const [progressTrend, setProgressTrend] = useState([]);
  const [assessmentCompletion, setAssessmentCompletion] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [repeatAnalysis, setRepeatAnalysis] = useState([]);
  const [riskDistribution, setRiskDistribution] = useState([]);
  const [studentProgressSnapshot, setStudentProgressSnapshot] = useState([]);

  useEffect(() => {
    setIsMounted(true);
    if (status === 'authenticated' && session?.user) {
      fetchAnalyticsData();
    }
  }, [status, session]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching analytics data from Firebase...');
      const response = await adminAPI.getAnalytics();
      
      if (response.success) {
        const { analytics } = response;
        
        setProgressTrend(analytics.progressTrend || []);
        setAssessmentCompletion(analytics.assessmentCompletion || []);
        setAttendanceLogs(analytics.attendanceLogs || []);
        setRepeatAnalysis(analytics.repeatAnalysis || []);
        setRiskDistribution(analytics.riskDistribution || []);
        setStudentProgressSnapshot(analytics.studentProgressSnapshot || []);
        
        console.log('✅ Analytics data loaded successfully');
      } else {
        throw new Error('Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('❌ Error fetching analytics data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Helpers ----------
  const toCSV = (rows, headers) => {
    const head = headers.join(",");
    const body = rows
      .map((r) =>
        headers
          .map((h) => {
            const v = r[h] ?? "";
            const s = String(v).replace(/"/g, '""');
            return s.includes(",") ? `"${s}"` : s;
          })
          .join(",")
      )
      .join("\n");
    return `${head}\n${body}`;
  };

  const downloadCSV = (filename, rows, headers) => {
    const csv = toCSV(rows, headers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build the four CSVs from the real data
  const onDownloadStudentProgressCSV = () => {
    downloadCSV("Student_Progress_Report.csv", studentProgressSnapshot, [
      "id",
      "name",
      "avg",
      "risk",
    ]);
  };

  const onDownloadAssessmentCSV = () => {
    const rows = assessmentCompletion.map((m) => ({
      module: m.module,
      completion_percent: m.completed,
    }));
    downloadCSV("Assessment_Completion_Report.csv", rows, [
      "module",
      "completion_percent",
    ]);
  };

  const onDownloadAttendanceCSV = () => {
    const rows = attendanceLogs.map((m) => ({
      module: m.module,
      total_sessions: m.total,
      attended_sessions: m.attended,
      participation_percent: Math.round((m.attended / m.total) * 100),
    }));
    downloadCSV("Attendance_Participation_Report.csv", rows, [
      "module",
      "total_sessions",
      "attended_sessions",
      "participation_percent",
    ]);
  };

  const onDownloadRepeatCSV = () => {
    const rows = repeatAnalysis.map((m) => ({
      module: m.module,
      repeats: m.repeats,
    }));
    downloadCSV("Repeat_Analysis_Report.csv", rows, ["module", "repeats"]);
  };

  // Print-friendly PDF (use browser "Save as PDF")
  const onSavePDF = () => {
    const printContents = printRef.current?.innerHTML || "";
    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>EduBoost — Analytics & Reports</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; padding: 24px; background: #0c0a09; color: #e5e7eb; }
            h1,h2,h3 { margin: 0 0 8px; color: #bfdbfe; }
            .section { margin-bottom: 24px; }
            table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            th, td { border: 1px solid #4b5563; padding: 12px; font-size: 12px; text-align: left; }
            th { background: #1f2937; color: #d1d5db; font-weight: 600; }
            td { background: #111827; }
            .muted { color: #9ca3af; font-size: 12px; }
            @media print {
              .no-print { display: none; }
              body { background: #fff; color: #000; }
              table, th, td { border-color: #d1d5db; color: #000; }
              th { background: #f3f4f6; }
            }
          </style>
        </head>
        <body>
          <h1 style="color: #1d4ed8; text-align: center;">EduBoost Analytics Report</h1>
          <div class="muted" style="text-align: center; margin-bottom: 24px;">Generated on: ${new Date().toLocaleDateString()}</div>
          ${printContents}
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-6 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-lg text-gray-300">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-6 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌ Error Loading Analytics</div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animated-entry {
          animation: fadeInSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .card-animated {
          animation: fadeInSlideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        .glass-effect-dark {
          background-color: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px) saturate(200%);
          -webkit-backdrop-filter: blur(15px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 40px 0 rgba(0, 0, 0, 0.4);
        }
      `}</style>
      <div className="main-font min-h-screen p-6 text-white">
        <header
          className={`mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 opacity-0 ${isMounted ? 'animated-entry' : ''}`}
          style={{ animationDelay: '0.1s' }}
        >
          <h1 className="text-4xl font-bold header-font flex items-center">
            <BarChart2 className="w-10 h-10 mr-3 text-blue-400" />
            Analytics & Reports
          </h1>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={fetchAnalyticsData}
              className="glass-effect-dark px-3 py-2 rounded-lg shadow-md hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={onDownloadStudentProgressCSV}
              className="glass-effect-dark px-3 py-2 rounded-lg shadow-md hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
            >
              <Download size={16} /> Progress
            </button>
            <button
              onClick={onDownloadAssessmentCSV}
              className="glass-effect-dark px-3 py-2 rounded-lg shadow-md hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
            >
              <Download size={16} /> Assessments
            </button>
            <button
              onClick={onDownloadAttendanceCSV}
              className="glass-effect-dark px-3 py-2 rounded-lg shadow-md hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
            >
              <Download size={16} /> Attendance
            </button>
            <button
              onClick={onDownloadRepeatCSV}
              className="glass-effect-dark px-3 py-2 rounded-lg shadow-md hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
            >
              <Download size={16} /> Repeats
            </button>
            <button
              onClick={onSavePDF}
              className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
            >
              <Printer size={16} /> Save as PDF
            </button>
          </div>
        </header>

        <div
          ref={printRef}
          id="report-area"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Line: Average Student Progress Trend */}
          <div
            className={`glass-effect-dark rounded-2xl p-6 lg:col-span-2 opacity-0 ${isMounted ? 'card-animated' : ''}`}
            style={{ animationDelay: '0.2s' }}
          >
            <h3 className="text-xl font-semibold mb-1 text-blue-400">
              Average Student Progress (Last 5 Months)
            </h3>
            <p className="text-gray-400 text-sm mb-4">Overall progress trend</p>
            <div className="h-64">
              {progressTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressTrend}>
                    <CartesianGrid stroke="#4b5563" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#d1d5db' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">📊</p>
                    <p>No progress data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pie: Risk Levels */}
          <div
            className={`glass-effect-dark rounded-2xl p-6 opacity-0 ${isMounted ? 'card-animated' : ''}`}
            style={{ animationDelay: '0.3s' }}
          >
            <h3 className="text-xl font-semibold mb-1 text-blue-400">
              Risk Level Distribution
            </h3>
            <p className="text-gray-400 text-sm mb-4">Low / Medium / High</p>
            <div className="h-64">
              {riskDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#d1d5db' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value, entry) => (
                        <span className="text-gray-400">{value}</span>
                      )}
                    />
                    <Pie
                      data={riskDistribution}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">🎯</p>
                    <p>No risk data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bar: Assessment Completion */}
          <div
            className={`glass-effect-dark rounded-2xl p-6 lg:col-span-2 opacity-0 ${isMounted ? 'card-animated' : ''}`}
            style={{ animationDelay: '0.4s' }}
          >
            <h3 className="text-xl font-semibold mb-1 text-blue-400">
              Assessment Completion by Module
            </h3>
            <p className="text-gray-400 text-sm mb-4">% completed</p>
            <div className="h-64">
              {assessmentCompletion.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assessmentCompletion}>
                    <CartesianGrid stroke="#4b5563" strokeDasharray="3 3" />
                    <XAxis dataKey="module" stroke="#9ca3af" />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '8px' }}
                      labelStyle={{ color: '#d1d5db' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Bar dataKey="completed" fill="#1e90ff" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">📊</p>
                    <p>No assessment data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table: Attendance/Participation */}
          <div
            className={`glass-effect-dark rounded-2xl p-6 opacity-0 ${isMounted ? 'card-animated' : ''}`}
            style={{ animationDelay: '0.5s' }}
          >
            <h3 className="text-xl font-semibold mb-1 text-blue-400">
              Attendance / Participation Logs
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Summary table — sessions vs attended
            </p>
            <div className="overflow-x-auto">
              {attendanceLogs.length > 0 ? (
                <table className="w-full text-sm rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-white/10 text-gray-300">
                      <th className="text-left p-4">Module</th>
                      <th className="text-left p-4">Total</th>
                      <th className="text-left p-4">Attended</th>
                      <th className="text-left p-4">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.map((r) => {
                      const pct = Math.round((r.attended / r.total) * 100);
                      return (
                        <tr key={r.module} className="border-b border-white/10">
                          <td className="p-4">{r.module}</td>
                          <td className="p-4">{r.total}</td>
                          <td className="p-4">{r.attended}</td>
                          <td className={`p-4 font-medium ${pct < 60 ? "text-red-400" : "text-green-400"}`}>
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">📅</p>
                    <p>No attendance data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table: Repeat Analysis */}
          <div
            className={`glass-effect-dark rounded-2xl p-6 opacity-0 ${isMounted ? 'card-animated' : ''}`}
            style={{ animationDelay: '0.6s' }}
          >
            <h3 className="text-xl font-semibold mb-1 text-blue-400">
              Repeat Analysis (by Module)
            </h3>
            <p className="text-gray-400 text-sm mb-4">Summary table — repeat counts</p>
            <div className="overflow-x-auto">
              {repeatAnalysis.length > 0 ? (
                <table className="w-full text-sm rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-white/10 text-gray-300">
                      <th className="text-left p-4">Module</th>
                      <th className="text-left p-4">Repeats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repeatAnalysis.map((r) => (
                      <tr key={r.module} className="border-b border-white/10">
                        <td className="p-4">{r.module}</td>
                        <td className="p-4">{r.repeats}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <div className="text-center">
                    <p className="text-lg mb-2">🔄</p>
                    <p>No repeat data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
