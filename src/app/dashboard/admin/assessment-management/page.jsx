'use client'
import { useState } from 'react'

const sampleAssessments = [
  { id: 1, module: 'Web Dev', educator: 'Mr. Perera', status: 'Completed', marks: 85 },
  { id: 2, module: 'DBMS', educator: 'Ms. Silva', status: 'Pending', marks: null },
  { id: 3, module: 'Networks', educator: 'Mr. Fernando', status: 'Completed', marks: 92 },
]

const AssessmentManagement = () => {
  const [assessments, setAssessments] = useState(sampleAssessments)
  const [filters, setFilters] = useState({ module: '', educator: '', status: '' })

  const handleDelete = (id) => {
    setAssessments(assessments.filter(a => a.id !== id))
  }

  const handleOverride = (id) => {
    const newMark = prompt("Enter new mark:")
    if (newMark) {
      setAssessments(prev =>
        prev.map(a => a.id === id ? { ...a, marks: parseInt(newMark), status: 'Completed' } : a)
      )
    }
  }

  const handleAdd = () => {
    const module = prompt("Module:")
    const educator = prompt("Educator:")
    const status = prompt("Status (Pending/Completed):")
    const marks = status === 'Completed' ? parseInt(prompt("Marks:")) : null
    const newAssessment = {
      id: assessments.length + 1,
      module,
      educator,
      status,
      marks
    }
    setAssessments([...assessments, newAssessment])
  }

  const filtered = assessments.filter(a =>
    (filters.module ? a.module.includes(filters.module) : true) &&
    (filters.educator ? a.educator.includes(filters.educator) : true) &&
    (filters.status ? a.status === filters.status : true)
  )

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Assessment Management</h1>

      <div className="mb-4 flex flex-wrap gap-4">
        <input
          className="border px-2 py-1 rounded"
          placeholder="Filter by Module"
          onChange={e => setFilters({ ...filters, module: e.target.value })}
        />
        <input
          className="border px-2 py-1 rounded"
          placeholder="Filter by Educator"
          onChange={e => setFilters({ ...filters, educator: e.target.value })}
        />
        <select
          className="border px-2 py-1 rounded"
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
        <button onClick={handleAdd} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
          + Add Assessment
        </button>
      </div>

      <table className="w-full bg-white border rounded-lg shadow-md text-sm">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 text-left">Module</th>
            <th className="p-2 text-left">Educator</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Marks</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(a => (
            <tr key={a.id} className="border-t">
              <td className="p-2">{a.module}</td>
              <td className="p-2">{a.educator}</td>
              <td className="p-2">{a.status}</td>
              <td className="p-2">{a.marks !== null ? a.marks : '—'}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => handleOverride(a.id)}
                  className="text-sm bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                >
                  Override
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">
                No assessments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default AssessmentManagement
