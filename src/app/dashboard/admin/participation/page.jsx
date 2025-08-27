"use client";
import { useState } from "react";
import { Download } from "lucide-react";

const dummyParticipation = [
  { id: 1, student: "Naveen Silva", module: "Data Science", participation: 85 },
  { id: 2, student: "Ishani Perera", module: "AI Fundamentals", participation: 45 },
  { id: 3, student: "Tharindu De Silva", module: "Networking", participation: 95 },
  { id: 4, student: "Anupa Rajapaksha", module: "Web Dev", participation: 40 },
];

export default function ParticipationPage() {
  const [filterModule, setFilterModule] = useState("All");

  const filtered = dummyParticipation.filter((item) =>
    filterModule === "All" ? true : item.module === filterModule
  );

  const downloadSummary = () => {
    const content = filtered
      .map(
        (item) =>
          `${item.student} | ${item.module} | ${item.participation}% participation`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Participation_Summary.txt";
    a.click();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Participation Oversight</h2>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <label>Filter by Module:</label>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="border px-3 py-1 rounded"
        >
          <option value="All">All</option>
          <option value="Data Science">Data Science</option>
          <option value="AI Fundamentals">AI Fundamentals</option>
          <option value="Networking">Networking</option>
          <option value="Web Dev">Web Dev</option>
        </select>

        <button
          onClick={downloadSummary}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Download size={18} />
          Download Summary
        </button>
      </div>

      {/* Table */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">Student</th>
            <th className="border p-2 text-left">Module</th>
            <th className="border p-2 text-left">Participation (%)</th>
            <th className="border p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr
              key={item.id}
              className={item.participation < 50 ? "bg-red-100" : ""}
            >
              <td className="border p-2">{item.student}</td>
              <td className="border p-2">{item.module}</td>
              <td className="border p-2">{item.participation}%</td>
              <td className="border p-2">
                {item.participation < 50 ? (
                  <span className="text-red-600 font-semibold">⚠️ Poor</span>
                ) : (
                  <span className="text-green-600">Good</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
