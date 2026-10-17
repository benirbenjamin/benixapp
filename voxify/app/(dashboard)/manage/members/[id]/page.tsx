'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { choirService } from '@/lib/services/choirService';
import { attendanceService, AttendanceStats } from '@/lib/services/attendanceService';
import { songService } from '@/lib/services/songService';
import { ChoirMember, Song } from '@/lib/types/database.types';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Percent,
  CheckCircle2,
  XCircle,
  Clock3,
  Check,
  ShieldCheck,
  Music,
  UserCheck,
  Loader2,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function SingerAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.id as string;

  const { activeChoir, isAdmin } = useChoir();

  const [member, setMember] = useState<ChoirMember | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [learningSummary, setLearningSummary] = useState<{ readyCount: number; learningCount: number }>({ readyCount: 0, learningCount: 0 });
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSingerProfile() {
      if (!activeChoir || !memberId) return;
      setLoading(true);

      const [membersList, attStats, attHistory, learnSum, choirSongs] = await Promise.all([
        choirService.getChoirMembers(activeChoir.id),
        attendanceService.getMemberAttendanceStats(memberId),
        attendanceService.getMemberAttendanceHistory(memberId),
        songService.getMemberLearningSummary(memberId),
        songService.getChoirSongs(activeChoir.id),
      ]);

      const targetMember = membersList.find(m => m.id === memberId) || null;
      setMember(targetMember);
      setAttendanceStats(attStats);
      setAttendanceHistory(attHistory);
      setLearningSummary(learnSum);
      setSongs(choirSongs);

      setLoading(false);
    }
    loadSingerProfile();
  }, [activeChoir, memberId]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4 max-w-xl mx-auto">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs">You must be a Choir Master or Director to view individual singer analytics.</p>
        <Link href="/manage" className="inline-flex items-center gap-2 text-xs text-purple-400 hover:underline pt-2 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Choir Admin
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 space-y-3 max-w-xl mx-auto">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400" />
        <p className="text-xs font-semibold">Loading singer attendance &amp; performance analytics...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4 max-w-xl mx-auto">
        <User className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Singer Profile Not Found</h2>
        <p className="text-xs">The requested choir member profile could not be found in this choir.</p>
        <Link href="/manage" className="inline-flex items-center gap-2 text-xs text-purple-400 hover:underline pt-2 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Choir Admin Roster
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Present
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Absent
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
            <Clock3 className="w-3.5 h-3.5 text-amber-400" /> Late
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
            <Check className="w-3.5 h-3.5 text-indigo-400" /> Excused
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-900 dark:text-white py-4">
      {/* Universal Back Button */}
      <Link href="/manage" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Choir Admin Roster
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {member.profile?.avatar_url ? (
            <img
              src={member.profile.avatar_url}
              alt={member.profile.full_name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-200 dark:border-blue-800 shadow-md shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md shrink-0">
              {member.profile?.full_name?.charAt(0) || 'S'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                {member.role}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md capitalize bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                {member.status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">{member.profile?.full_name}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {member.profile?.email} {member.profile?.phone ? `• Phone: ${member.profile.phone}` : ''} • Joined {new Date(member.joined_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <Link
            href="/manage/attendance"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Record New Attendance
          </Link>
        </div>
      </div>

      {/* Singer Attendance & Performance Hero Analytics */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Singer Attendance &amp; Song Readiness Analytics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Personal Attendance Rate Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Rate</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {attendanceStats?.attendancePercentage || 100}%
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${attendanceStats?.attendancePercentage || 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Total sessions recorded: {attendanceStats?.totalRecords || 0}</p>
          </div>

          {/* Sessions Attended Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Present / Attended</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{attendanceStats?.presentCount || 0}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{attendanceStats?.lateCount || 0} late, {attendanceStats?.excusedCount || 0} excused</p>
          </div>

          {/* Sessions Missed / Absent Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Absent / Missed</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{attendanceStats?.absentCount || 0}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Unexcused rehearsal absences</p>
          </div>

          {/* Songs Prepared / Ready Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Songs Learnt</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                <Music className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{learningSummary.readyCount}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{learningSummary.learningCount} currently in practice</p>
          </div>
        </div>
      </div>

      {/* Rehearsal Attendance Log Timeline */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Attendance History Log ({attendanceHistory.length} Sessions)
        </h2>

        {attendanceHistory.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs">No rehearsal attendance records found for this singer yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4 rounded-l-xl">Session Title</th>
                  <th className="p-4">Date &amp; Time Recorded</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Attendance Status</th>
                  <th className="p-4 rounded-r-xl">Director Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceHistory.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {rec.rehearsal?.title || rec.event?.title || 'Choir Session'}
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(rec.recorded_at).toLocaleDateString()} {new Date(rec.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                      {rec.rehearsal?.location || rec.event?.location || 'Main Sanctuary'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(rec.status)}
                    </td>
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                      {rec.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Choir Songs Practice Status */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Choir Music Library ({songs.length} Songs)</span>
          <Link href="/songs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
            View All Songs →
          </Link>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {songs.map(s => (
            <div key={s.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider">{s.category}</span>
                <h4 className="font-bold text-slate-900 dark:text-white">{s.title}</h4>
                {s.composer && <p className="text-xs text-slate-500 dark:text-slate-400">{s.composer}</p>}
              </div>

              <Link
                href={`/songs/${s.id}`}
                className="bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800/40 flex items-center gap-1 shrink-0"
              >
                <Music className="w-3.5 h-3.5" /> Practice
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
