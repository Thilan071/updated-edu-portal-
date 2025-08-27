"use client";
import React, { useMemo, useState } from "react";

// ---------- Demo data (hardcoded) ----------
const LOGS = [
  { id: 1,  ts: "2025-08-13T09:10:00", actorRole: "Admin",     actor: "admin@eduboost.io",   action: "CREATE_USER",     target: "student S019", details: "Approved student signup" },
  { id: 2,  ts: "2025-08-13T09:25:41", actorRole: "Educator",  actor: "lecturer1@campus.lk", action: "MARKS_OVERRIDE",  target: "DBMS A1",      details: "Override 68 → 72 (rubric recheck)" },
  { id: 3,  ts: "2025-08-13T10:05:12", actorRole: "Student",   actor: "s001@campus.lk",       action: "LOGIN",           target: "-",            details: "Successful login" },
  { id: 4,  ts: "2025-08-12T15:02:30", actorRole: "Admin",     actor: "admin@eduboost.io",   action: "SEND_NOTIFICATION",target: "Batch B2024A", details: "Exam reminder" },
  { id: 5,  ts: "2025-08-12T13:44:00", actorRole: "Educator",  actor: "lecturer2@campus.lk", action: "CREATE_ASSESSMENT",target: "WT Quiz 02",   details: "Weight 10%" },
  { id: 6,  ts: "2025-08-12T11:17:19", actorRole: "Student",   actor: "s002@campus.lk",       action: "SUBMIT_ASSESSMENT",target: "PF A1",        details: "PDF uploaded" },
  { id: 7,  ts: "2025-08-11T09:00:14", actorRole: "Educator",  actor: "lecturer1@campus.lk", action: "ATTENDANCE_UPDATE",target: "DBMS",         details: "Marked 3 absences" },
  { id: 8,  ts: "2025-08-11T08:41:51", actorRole: "Admin",     actor: "admin@eduboost.io",   action: "DISABLE_USER",     target: "student S014", details: "Policy violation" },
  { id: 9,  ts: "2025-08-10T16:23:33", actorRole: "Student",   actor: "s004@campus.lk",       action: "PASSWORD_RESET",   target: "-",            details: "Self-service reset" },
  { id: 10, ts: "2025-08-10T09:05:27", actorRole: "Educator",  actor: "lecturer3@campus.lk", action: "CREATE_ASSESSMENT",target: "CN Lab 01",     details: "Auto-check scripts" },
  { id: 11, ts: "2025-08-09T18:40:10", actorRole: "Admin",     actor: "admin@eduboost.io",   action: "MODULE_EDIT",      target: "Networks",     details: "Updated end date" },
  { id: 12, ts: "2025-08-09T10:22:48", actorRole: "Student",   actor: "s006@campus.lk",       action: "LOGIN",           target: "-",            details: "Successful login" },
];

// ---------- Helpers ----------
const roleBadge = (role) => {
  if (role === "Admin") return "bg-blue-100 text-blue-700";
  if (role === "Educator") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700"; // Student
};
const actionBadge = (action) => {
  const map = {
    CREATE_USER: "bg-blue-50 text-blue-700",
    DISABLE_USER: "bg-rose-50 text-rose-700",
    MODULE_EDIT: "bg-indigo-50 text-indigo-700",
    CREATE_ASSESSMENT: "bg-emerald-50 text-emerald-700",
    MARKS_OVERRIDE: "bg-purple-50 text-purple-700",
    ATTENDANCE_UPDATE: "bg-teal-50 text-teal-700",
    SEND_NOTIFICATION: "bg-yellow-50 text-yellow-700",
    SUBMIT_ASSESSMENT: "bg-cyan-50 text-cyan-700",
    PASSWORD_RESET: "bg-zinc-50 text-zinc-700",
    LOGIN: "bg-gray-50 text-gray-700",
  };
  return map[action] || "bg-gray-50 text-gray-700";
};
const toCSV = (rows) => {
  const headers = ["timestamp","role","actor","action","target","details"];
  const head = headers.join(",");
  const body = rows.map(r => {
    const v = [
      new Date(r.ts).toLocaleString(),
      r.actorRole,
      r.actor,
      r.action,
      r.target,
      r.details?.replace(/"/g,'""') || ""
    ].map(x => (String(x).includes(",") ? `"${x}"` : x)).join(",");
    return v;
  }).join("\n");
  return `${head}\n${body}`;
};

export default function AuditLogsPage() {
  const [role, setRole] = useState("All");
  const [action, setAction] = useState("All");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const actions = useMemo(() => {
    const s = new Set(LOGS.map(l => l.action));
    return ["All", ...Array.from(s)];
  }, []);

  const filtered = useMemo(() => {
    return LOGS.filter((l) => {
      if (role !== "All" && l.actorRole !== role) return false;
      if (action !== "All" && l.action !== action) return false;
      if (q) {
        const blob = `${l.actor} ${l.action} ${l.target} ${l.details}`.toLowerCase();
        if (!blob.includes(q.toLowerCase())) return false;
      }
      if (from && new Date(l.ts) < new Date(from)) return false;
      if (to && new Date(l.ts) > new Date(to)) return false;
      return true;
    }).sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }, [role, action, q, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const downloadCSV = () => {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EduBoost_Audit_Logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setRole("All"); setAction("All"); setQ(""); setFrom(""); setTo(""); setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 className="text-2xl font-bold text-[#005EB8]">🗂 System Logs & Audit</h1>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="bg-white border px-3 py-2 rounded shadow hover:bg-gray-50">
            ⬇ Export CSV (filtered)
          </button>
          <button onClick={resetFilters} className="bg-white border px-3 py-2 rounded shadow hover:bg-gray-50">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Role</label>
            <select className="border rounded px-2 py-2" value={role} onChange={(e) => { setRole(e.target.value); setPage(1);} }>
              {["All","Admin","Educator","Student"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Action</label>
            <select className="border rounded px-2 py-2" value={action} onChange={(e) => { setAction(e.target.value); setPage(1);} }>
              {actions.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="text-xs text-gray-500 mb-1">Search</label>
            <input
              className="border rounded px-3 py-2"
              placeholder="actor, target, details…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1);} }
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">From</label>
            <input type="date" className="border rounded px-2 py-2" value={from} onChange={(e)=>{ setFrom(e.target.value); setPage(1);} }/>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">To</label>
            <input type="date" className="border rounded px-2 py-2" value={to} onChange={(e)=>{ setTo(e.target.value); setPage(1);} }/>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 border-b">
              <tr>
                <th className="text-left p-3">Timestamp</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Actor</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Target</th>
                <th className="text-left p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((l) => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 whitespace-nowrap">{new Date(l.ts).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge(l.actorRole)}`}>
                      {l.actorRole}
                    </span>
                  </td>
                  <td className="p-3">{l.actor}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionBadge(l.action)}`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="p-3">{l.target}</td>
                  <td className="p-3">{l.details}</td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No logs for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t bg-gray-50">
          <span className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="text-sm px-2 py-1">{page} / {totalPages}</span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Footnote */}
      <p className="mt-3 text-xs text-gray-500">
        * Demo only. In production, logs would be append-only and stored in an immutable audit collection.
      </p>
    </div>
  );
}
