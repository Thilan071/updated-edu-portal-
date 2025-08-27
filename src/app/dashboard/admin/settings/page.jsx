'use client';
import React, { useMemo, useState, useEffect } from "react";
import { motion } from 'framer-motion';

// ---------------- Mock Data ----------------
const mockUsers = [
  { id: "U001", name: "Admin One", email: "admin@eduboost.io", role: "Admin" },
  { id: "U002", name: "Tharindu Silva", email: "lecturer1@campus.lk", role: "Educator" },
  { id: "U003", name: "Isuri Jayasundara", email: "s003@campus.lk", role: "Student" },
];

const allRoles = ["Admin", "Educator", "Student"];

const mockModules = [
  "Programming Fundamentals",
  "DBMS",
  "Networks",
  "Web Technologies",
  "Cybersecurity",
];

// default permissions (per role)
const defaultPermissions = {
  Admin: {
    viewStudents: true,
    editMarks: true,
    manageModules: true,
    sendNotifications: true,
    viewAnalytics: true,
    manageSettings: true,
  },
  Educator: {
    viewStudents: true,
    editMarks: true,
    manageModules: false,
    sendNotifications: true,
    viewAnalytics: true,
    manageSettings: false,
  },
  Student: {
    viewStudents: false,
    editMarks: false,
    manageModules: false,
    sendNotifications: false,
    viewAnalytics: false,
    manageSettings: false,
  },
};

// default module visibility by role
const defaultVisibility = {
  Admin: [...mockModules],
  Educator: [...mockModules],
  Student: ["Programming Fundamentals", "DBMS", "Web Technologies"], // example limitation
};

// default system config
const defaultSystem = {
  termStart: "2025-09-01",
  termEnd: "2025-12-20",
  timezone: "Asia/Colombo",
  repeatMinAttendance: 70, // %
  repeatFeeRequired: true,
  passGradeThreshold: 50, // %
  lowParticipationAlert: 60, // %
  allowAIMarking: true,
  notificationsDefaultChannel: "In-App", // In-App / Email / Both
};

export default function SettingsAccessControlPage() {
  const [users, setUsers] = useState(mockUsers);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [visibility, setVisibility] = useState(defaultVisibility);
  const [systemConfig, setSystemConfig] = useState(defaultSystem);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateUserRole = (id, role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const togglePermission = (role, key) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role][key] },
    }));
  };

  const toggleVisibility = (role, moduleName) => {
    setVisibility((prev) => {
      const set = new Set(prev[role]);
      if (set.has(moduleName)) set.delete(moduleName);
      else set.add(moduleName);
      return { ...prev, [role]: Array.from(set) };
    });
  };

  const updateSystem = (key, value) => {
    setSystemConfig((prev) => ({ ...prev, [key]: value }));
  };

  const resetAll = () => {
    setUsers(mockUsers);
    setPermissions(defaultPermissions);
    setVisibility(defaultVisibility);
    setSystemConfig(defaultSystem);
  };

  const combinedPreview = useMemo(
    () => ({
      users,
      permissions,
      visibility,
      systemConfig,
    }),
    [users, permissions, visibility, systemConfig]
  );

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(combinedPreview, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eduboost_settings_demo.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeInSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animated-entry {
          animation: fadeInSlideUp 0.6s ease-out forwards;
        }

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
        
        .tab-button-active {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <div className="main-font min-h-screen bg-gray-900 text-white p-6 md:p-10">
        {/* Header + Actions */}
        <header
          className={`mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between opacity-0 ${isMounted ? 'animated-entry' : ''}`}
          style={{ animationDelay: '0.1s' }}
        >
          <h1 className="text-3xl font-bold flex items-center header-font text-white">
            <span className="text-blue-400 mr-2">⚙️</span> Settings & Access Control
          </h1>
          <div className="flex gap-2">
            <motion.button
              onClick={downloadJSON}
              className="glass-effect-dark border px-4 py-2 rounded-xl shadow-lg hover:bg-white/10 text-white transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⬇ Export JSON
            </motion.button>
            <motion.button
              onClick={resetAll}
              className="glass-effect-dark border px-4 py-2 rounded-xl shadow-lg hover:bg-white/10 text-white transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Reset to Defaults
            </motion.button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* --- Column 1: Role Management --- */}
          <motion.div
            className="glass-effect-dark rounded-2xl p-6"
            variants={cardVariants}
            initial="hidden"
            animate={isMounted ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Manage User Roles</h2>
            <p className="text-sm text-gray-400 mb-4">
              Assign roles to platform users. (Demo: local state only)
            </p>
            <div className="space-y-4">
              {users.map((u, idx) => (
                <motion.div 
                  key={u.id} 
                  className="glass-effect-dark-hover border rounded-xl p-3 flex items-center justify-between"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div>
                    <p className="font-medium text-lg">{u.name}</p>
                    <p className="text-sm text-gray-400">{u.email}</p>
                  </div>
                  <select
                    className="border rounded px-2 py-1 bg-gray-800 text-white"
                    value={u.role}
                    onChange={(e) => updateUserRole(u.id, e.target.value)}
                  >
                    {allRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* --- Column 2: Permissions Matrix --- */}
          <motion.div
            className="glass-effect-dark rounded-2xl p-6"
            variants={cardVariants}
            initial="hidden"
            animate={isMounted ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Permissions Matrix</h2>
            <p className="text-sm text-gray-400 mb-4">
              Toggle capabilities per role. (Demo only)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/10">
                    <th className="text-left p-2">Permission</th>
                    {allRoles.map((role) => (
                      <th key={role} className="text-left p-2">
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "viewStudents", label: "View Students" },
                    { key: "editMarks", label: "Edit Marks" },
                    { key: "manageModules", label: "Manage Modules" },
                    { key: "sendNotifications", label: "Send Notifications" },
                    { key: "viewAnalytics", label: "View Analytics" },
                    { key: "manageSettings", label: "Manage Settings" },
                  ].map((perm) => (
                    <tr key={perm.key} className="border-b border-white/10">
                      <td className="p-2 text-gray-300">{perm.label}</td>
                      {allRoles.map((role) => (
                        <td key={role} className="p-2">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={permissions[role][perm.key]}
                              onChange={() => togglePermission(role, perm.key)}
                              className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600 bg-gray-800 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-400">Allow</span>
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* --- Column 3: Module Visibility --- */}
          <motion.div
            className="glass-effect-dark rounded-2xl p-6"
            variants={cardVariants}
            initial="hidden"
            animate={isMounted ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Module Visibility by Role</h2>
            <p className="text-sm text-gray-400 mb-4">
              Choose which modules each role can view.
            </p>
            <div className="space-y-4">
              {allRoles.map((role) => (
                <div key={role} className="glass-effect-dark-hover border rounded-xl p-3">
                  <p className="font-medium text-lg mb-2 text-gray-200">{role}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mockModules.map((m) => (
                      <label key={m} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={visibility[role].includes(m)}
                          onChange={() => toggleVisibility(role, m)}
                          className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600 bg-gray-800 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* --- Full-width System Config --- */}
          <motion.div
            className="glass-effect-dark rounded-2xl p-6 xl:col-span-3"
            variants={cardVariants}
            initial="hidden"
            animate={isMounted ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-400">System Configuration</h2>
            <p className="text-sm text-gray-400 mb-4">
              Term dates, policies and platform defaults (demo state only).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Term Start</label>
                <input
                  type="date"
                  className="glass-effect-dark px-2 py-2 rounded-md"
                  value={systemConfig.termStart}
                  onChange={(e) => updateSystem("termStart", e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Term End</label>
                <input
                  type="date"
                  className="glass-effect-dark px-2 py-2 rounded-md"
                  value={systemConfig.termEnd}
                  onChange={(e) => updateSystem("termEnd", e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Timezone</label>
                <input
                  className="glass-effect-dark px-2 py-2 rounded-md"
                  value={systemConfig.timezone}
                  onChange={(e) => updateSystem("timezone", e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Repeat Min Attendance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="glass-effect-dark px-2 py-2 rounded-md"
                  value={systemConfig.repeatMinAttendance}
                  onChange={(e) => updateSystem("repeatMinAttendance", Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-2 mt-6">
                <input
                  id="fee"
                  type="checkbox"
                  checked={systemConfig.repeatFeeRequired}
                  onChange={(e) => updateSystem("repeatFeeRequired", e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600 bg-gray-800 focus:ring-blue-500"
                />
                <label htmlFor="fee" className="text-sm text-gray-300">Repeat Fee Required</label>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Pass Grade Threshold (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="glass-effect-dark px-2 py-2 rounded-md"
                  value={systemConfig.passGradeThreshold}
                  onChange={(e) => updateSystem("passGradeThreshold", Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Low Participation Alert (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="glass-effect-dark px-2 py-2 rounded-md"
                  value={systemConfig.lowParticipationAlert}
                  onChange={(e) => updateSystem("lowParticipationAlert", Number(e.target.value))}
                />
              </div>

              <div className="flex items-center gap-2 mt-6">
                <input
                  id="ai"
                  type="checkbox"
                  checked={systemConfig.allowAIMarking}
                  onChange={(e) => updateSystem("allowAIMarking", e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-600 bg-gray-800 focus:ring-blue-500"
                />
                <label htmlFor="ai" className="text-sm text-gray-300">Enable AI Marking (Beta)</label>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Default Notification Channel</label>
                <select
                  className="glass-effect-dark px-2 py-2 rounded-md"
                  value={systemConfig.notificationsDefaultChannel}
                  onChange={(e) =>
                    updateSystem("notificationsDefaultChannel", e.target.value)
                  }
                >
                  <option className="bg-gray-800">In-App</option>
                  <option className="bg-gray-800">Email</option>
                  <option className="bg-gray-800">Both</option>
                </select>
              </div>
            </div>

            {/* Demo Save (no backend) */}
            <div className="mt-6 flex gap-2">
              <motion.button
                onClick={() => alert("Demo: Settings saved locally in state.")}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                💾 Save Settings (Demo)
              </motion.button>
              <motion.button
                onClick={downloadJSON}
                className="glass-effect-dark px-4 py-2 rounded-xl shadow-lg hover:bg-white/10 text-white transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ⬇ Export Settings JSON
              </motion.button>
            </div>
          </motion.div>

          {/* --- Preview (Read-only) --- */}
          <motion.div
            className="glass-effect-dark rounded-2xl p-6 xl:col-span-3"
            variants={cardVariants}
            initial="hidden"
            animate={isMounted ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Live Preview (Read-only)</h2>
            <pre className="text-xs bg-gray-900 text-gray-100 rounded-xl p-4 overflow-auto">
              {JSON.stringify(combinedPreview, null, 2)}
            </pre>
          </motion.div>
        </div>

        {/* Footnote */}
        <p className="mt-6 text-sm text-gray-500">
          * Demo page only. In a real application, these settings would persist to a secure database and updates would be audited.
        </p>
      </div>
    </>
  );
}