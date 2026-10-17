'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { attendanceService } from '@/lib/services/attendanceService';
import { choirService } from '@/lib/services/choirService';
import { Rehearsal, ChoirMember, AttendanceStatus } from '@/lib/types/database.types';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  AlertCircle,
  Plus,
  Save,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function RecordAttendancePage() {
  const { activeChoir, isAdmin } = useChoir();

  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [selectedRehearsalId, setSelectedRehearsalId] = useState<string>('');
  const [members, setMembers] = useState<ChoirMember[]>([]);

  // Attendance state per member: memberId -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick New Rehearsal Form
  const [showNewRehearsalForm, setShowNewRehearsalForm] = useState(false);
  const [newTitle, setNewTitle] = useState('Weekly Choir Rehearsal');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('17:00');
  const [creatingRehearsal, setCreatingRehearsal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!activeChoir) return;
      setLoading(true);
      const [rehList, memberList] = await Promise.all([
        attendanceService.getRehearsals(activeChoir.id),
        choirService.getChoirMembers(activeChoir.id),
      ]);

      const activeOnly = memberList.filter(m => m.status === 'active');
      setMembers(activeOnly);
      setRehearsals(rehList);

      if (rehList.length > 0) {
        setSelectedRehearsalId(rehList[0].id);
      }

      setLoading(false);
    }
    loadData();
  }, [activeChoir]);

  useEffect(() => {
    async function loadExistingAttendance() {
      if (!selectedRehearsalId) return;
      const records = await attendanceService.getRehearsalAttendance(selectedRehearsalId);
      
      const newAttMap: Record<string, AttendanceStatus> = {};
      const newNotesMap: Record<string, string> = {};

      records.forEach(r => {
        newAttMap[r.member_id] = r.status;
        if (r.notes) newNotesMap[r.member_id] = r.notes;
      });

      // Default unrecorded members to 'present'
      members.forEach(m => {
        if (!newAttMap[m.id]) {
          newAttMap[m.id] = 'present';
        }
      });

      setAttendanceMap(newAttMap);
      setNotesMap(newNotesMap);
    }

    if (selectedRehearsalId && members.length > 0) {
      loadExistingAttendance();
    }
  }, [selectedRehearsalId, members]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs">You must be a Choir Director or Admin to manage attendance.</p>
      </div>
    );
  }

  const handleCreateRehearsal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoir) return;
    setCreatingRehearsal(true);

    const newReh = await attendanceService.createRehearsal({
      choir_id: activeChoir.id,
      title: newTitle,
      date: newDate,
      start_time: newStartTime,
    });

    if (newReh) {
      setRehearsals(prev => [newReh, ...prev]);
      setSelectedRehearsalId(newReh.id);
      setShowNewRehearsalForm(false);
      setMessage({ type: 'success', text: 'New rehearsal session created!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to create rehearsal session.' });
    }
    setCreatingRehearsal(false);
  };

  const handleSaveAttendance = async () => {
    if (!selectedRehearsalId) return;
    setSaving(true);
    setMessage(null);

    const records = Object.entries(attendanceMap).map(([member_id, status]) => ({
      rehearsal_id: selectedRehearsalId,
      member_id,
      status,
      notes: notesMap[member_id] || undefined,
    }));

    const ok = await attendanceService.recordAttendance(records);
    if (ok) {
      setMessage({ type: 'success', text: 'Attendance recorded successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to save attendance records.' });
    }
    setSaving(false);
  };

  const setStatusForMember = (memberId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [memberId]: status }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-900 dark:text-white">
      <Link href="/manage" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Choir Admin
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" /> Rehearsal Attendance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Mark member presence, tardiness, or excused absences for rehearsal sessions</p>
        </div>
        <button
          onClick={() => setShowNewRehearsalForm(prev => !prev)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" /> Create Rehearsal Session
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* New Rehearsal Form Modal/Box */}
      {showNewRehearsalForm && (
        <form onSubmit={handleCreateRehearsal} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Rehearsal Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Session Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Date</label>
              <input
                type="date"
                required
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1">Start Time</label>
              <input
                type="time"
                required
                value={newStartTime}
                onChange={e => setNewStartTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNewRehearsalForm(false)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingRehearsal}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
            >
              {creatingRehearsal ? 'Creating...' : 'Save Rehearsal'}
            </button>
          </div>
        </form>
      )}

      {/* Select Active Rehearsal */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Rehearsal Session</label>
            <select
              value={selectedRehearsalId}
              onChange={e => setSelectedRehearsalId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-semibold"
            >
              {rehearsals.length === 0 ? (
                <option value="">No Rehearsal Sessions Found</option>
              ) : (
                rehearsals.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} — {r.date} ({r.start_time})
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={saving || !selectedRehearsalId}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all self-end sm:self-center cursor-pointer"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving Records...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {/* Member Roster Table */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Choir Roster ({members.length} Active Members)</span>
        </h2>

        {loading ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">Loading choir members...</p>
        ) : members.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">No active members in roster.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 rounded-l-xl">Singer Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Attendance Status</th>
                  <th className="p-4 rounded-r-xl">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map(m => {
                  const currentStatus = attendanceMap[m.id] || 'present';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white">
                        {m.profile?.full_name || 'Choir Member'}
                        <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400">{m.profile?.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold uppercase bg-slate-800 text-purple-300 border border-slate-700">
                          {m.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setStatusForMember(m.id, 'present')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Present
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusForMember(m.id, 'absent')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusForMember(m.id, 'late')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                              currentStatus === 'late'
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <Clock3 className="w-3.5 h-3.5" /> Late
                          </button>

                          <button
                            type="button"
                            onClick={() => setStatusForMember(m.id, 'excused')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                              currentStatus === 'excused'
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" /> Excused
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          value={notesMap[m.id] || ''}
                          onChange={e => setNotesMap(prev => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder="Optional note..."
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-full"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
