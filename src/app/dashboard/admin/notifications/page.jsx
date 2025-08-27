'use client';
import { useState } from 'react';

export default function NotificationHubPage() {
  const [form, setForm] = useState({
    target: '',
    module: '',
    batch: '',
    repeatStatus: '',
    riskLevel: '',
    message: '',
    scheduleDate: '',
  });

  const [logs, setLogs] = useState([
    {
      id: 1,
      message: 'Reminder: Submit assignment by Friday.',
      date: '2025-08-12T10:00:00',
      recipients: 'Batch 23 - SE - Repeats',
    },
    {
      id: 2,
      message: 'Welcome new students to Semester 2!',
      date: '2025-08-10T09:00:00',
      recipients: 'All New Students',
    },
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const handleSend = (e) => {
    e?.preventDefault?.();

    // basic guard
    if (!form.message.trim()) return;

    const recipients = [form.batch, form.module, form.repeatStatus, form.riskLevel]
      .filter(Boolean)
      .join(' ')
      .trim();

    const newLog = {
      id: Date.now(),
      message: form.message.trim(),
      date: form.scheduleDate || new Date().toISOString(),
      recipients: recipients || (form.target || 'All'),
    };

    setLogs((prev) => [newLog, ...prev]);

    setForm({
      target: '',
      module: '',
      batch: '',
      repeatStatus: '',
      riskLevel: '',
      message: '',
      scheduleDate: '',
    });
  };

  const card = 'bg-white/5 border border-white/10 rounded-2xl';
  const input =
    'w-full rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/60 px-3 py-2 focus:outline-none focus:ring focus:ring-blue-400/40 focus:border-blue-400';
  const label = 'block text-sm text-white/80 mb-1';
  const button =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 font-medium';
  const btnPrimary = `${button} bg-blue-600 hover:bg-blue-700 text-white`;
  const btnGhost = `${button} bg-white/10 hover:bg-white/20 text-white`;

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Notifications</h1>
          <p className="text-white/70">Send and review student notifications.</p>
        </div>
      </div>

      {/* Notification Form */}
      <section className={`${card} p-6 space-y-4`}>
        <h2 className="text-xl font-semibold">Send Notification</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={label}>Target Group</label>
              <input
                className={input}
                placeholder="Students / Educators"
                name="target"
                value={form.target}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={label}>Module</label>
              <input
                className={input}
                placeholder="e.g., DBMS, OOP"
                name="module"
                value={form.module}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={label}>Batch</label>
              <input
                className={input}
                placeholder="e.g., Y1.S1.B2"
                name="batch"
                value={form.batch}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={label}>Repeat Status</label>
              <input
                className={input}
                placeholder="e.g., Repeats / Fresh"
                name="repeatStatus"
                value={form.repeatStatus}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={label}>Risk Level</label>
              <input
                className={input}
                placeholder="High / Medium / Low"
                name="riskLevel"
                value={form.riskLevel}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={label}>Schedule Date (optional)</label>
              <input
                className={input}
                type="datetime-local"
                name="scheduleDate"
                value={form.scheduleDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className={label}>Message</label>
            <textarea
              rows={3}
              className={input}
              placeholder="Enter your announcement here..."
              name="message"
              value={form.message}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="reset"
              className={btnGhost}
              onClick={() =>
                setForm({
                  target: '',
                  module: '',
                  batch: '',
                  repeatStatus: '',
                  riskLevel: '',
                  message: '',
                  scheduleDate: '',
                })
              }
            >
              Clear
            </button>
            <button type="submit" className={btnPrimary} disabled={!form.message.trim()}>
              {form.scheduleDate ? 'Schedule Notification' : 'Send Now'}
            </button>
          </div>
        </form>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* Sent Logs */}
      <section className={`${card} p-6`}>
        <h2 className="text-xl font-semibold mb-4">Sent Notifications Log</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white/10">
                <th className="text-left font-semibold px-4 py-2">Date</th>
                <th className="text-left font-semibold px-4 py-2">Recipients</th>
                <th className="text-left font-semibold px-4 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-white/10">
                  <td className="px-4 py-2">{formatDate(log.date)}</td>
                  <td className="px-4 py-2">{log.recipients}</td>
                  <td className="px-4 py-2">{log.message}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-white/70 italic">
                    No notifications sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
