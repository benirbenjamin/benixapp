import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, User, Building2, Terminal } from 'lucide-react';
import { api } from '../../../api/client';

export function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await api.get('/superadmin/audit-logs');
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Security & System Audit Logs</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Complete chronological audit trail recording administrator logins, station creations, and configuration changes.
        </p>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading audit trail...</div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-400 text-sm">
          No audit logs recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Operator / User</th>
                  <th className="px-6 py-4">Target Station</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-sans font-semibold text-slate-900">
                      {log.username || log.user_id || 'System'}
                    </td>
                    <td className="px-6 py-4 font-sans">
                      {log.station_name ? (
                        <span className="font-bold text-indigo-700">{log.station_name}</span>
                      ) : (
                        <span className="text-slate-400">Global Platform</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-400">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
