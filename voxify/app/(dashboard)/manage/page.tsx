'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useChoir } from '@/lib/context/ChoirContext';
import { choirService } from '@/lib/services/choirService';
import { attendanceService, AttendanceStats } from '@/lib/services/attendanceService';
import { songService } from '@/lib/services/songService';
import { eventService } from '@/lib/services/eventService';
import { ChoirMember, Song, Event } from '@/lib/types/database.types';
import {
  Users,
  Music,
  Calendar,
  Settings,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Ban,
  Plus,
  TrendingUp,
  Percent,
  UserCheck,
  UserX,
  Clock3,
  ArrowLeft,
  BarChart3,
  Mail,
  Phone,
  Send,
  Loader2,
  Edit3,
  Trash2,
  EyeOff,
  Clock,
  MapPin
} from 'lucide-react';
import { planEnforcementService, PlanCheckResult } from '@/lib/services/planEnforcementService';
import { PlanLimitModal } from '@/components/plans/PlanLimitModal';

export default function ChoirAdminPage() {
  const { activeChoir, isAdmin } = useChoir();
  const [members, setMembers] = useState<ChoirMember[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Invite Singer State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Plan Limit Enforcement State
  const [limitCheckResult, setLimitCheckResult] = useState<PlanCheckResult | null>(null);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);

  // Event Action state
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminData() {
      if (!activeChoir) return;
      setLoadingStats(true);

      const [memberData, songData, eventData, attendanceStats] = await Promise.all([
        choirService.getChoirMembers(activeChoir.id),
        songService.getChoirSongs(activeChoir.id),
        eventService.getChoirEvents(activeChoir.id),
        attendanceService.getChoirAttendanceStats(activeChoir.id),
      ]);

      setMembers(memberData);
      setSongs(songData);
      setEvents(eventData);
      setStats(attendanceStats);
      setLoadingStats(false);
    }
    loadAdminData();
  }, [activeChoir]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-slate-400 space-y-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs">You must be a Choir Owner or Administrator to access this area.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-purple-400 hover:underline pt-2 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'active');

  const refreshEvents = async () => {
    if (activeChoir) {
      const data = await eventService.getChoirEvents(activeChoir.id);
      setEvents(data);
    }
  };

  const handleUpdateStatus = async (memberId: string, status: 'active' | 'rejected' | 'suspended') => {
    if (status === 'active' && activeChoir) {
      const limitCheck = await planEnforcementService.checkLimit(activeChoir.id, 'members');
      if (!limitCheck.allowed) {
        setLimitCheckResult(limitCheck);
        setIsLimitModalOpen(true);
        return;
      }
    }

    await choirService.updateMemberStatus(memberId, status);
    if (activeChoir) {
      const updated = await choirService.getChoirMembers(activeChoir.id);
      setMembers(updated);
    }
  };

  const handlePublishEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionId(eventId);
    await eventService.publishEvent(eventId);
    await refreshEvents();
    setActionId(null);
  };

  const handleUnpublishEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionId(eventId);
    await eventService.unpublishEvent(eventId);
    await refreshEvents();
    setActionId(null);
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete event "${eventTitle}"?`)) return;
    setActionId(eventId);
    await eventService.deleteEvent(eventId);
    await refreshEvents();
    setActionId(null);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChoir || !inviteEmail.trim()) return;

    setInviting(true);
    setInviteMsg(null);

    try {
      const res = await fetch('/api/choir/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choirId: activeChoir.id, email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteMsg({ type: 'success', text: `Invitation sent to ${inviteEmail}!` });
        setInviteEmail('');
      } else {
        setInviteMsg({ type: 'error', text: data.error || 'Failed to send invite.' });
      }
    } catch (err) {
      setInviteMsg({ type: 'error', text: 'Server error sending email invitation.' });
    }
    setInviting(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Universal Back Button */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Choir Admin Control Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-purple-400" /> Choir Master Control Center
          </h1>
          <p className="text-sm text-slate-400">
            Manage <span className="text-purple-300 font-bold">{activeChoir?.name}</span> • Roster, Invitations, Sunday Services &amp; Attendance Analytics
          </p>
        </div>

        <button
          onClick={() => setInviteModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Mail className="w-4 h-4" /> Invite Singer by Email
        </button>
      </div>

      {/* Email Invitation Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" /> Invite Singer to Choir
              </h3>
              <button
                onClick={() => { setInviteModalOpen(false); setInviteMsg(null); }}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {inviteMsg && (
              <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                inviteMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {inviteMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{inviteMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Singer Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="singer@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">The singer will receive an instant invitation email with choir join instructions.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setInviteModalOpen(false); setInviteMsg(null); }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md flex items-center gap-1.5"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {inviting ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Choir Performance Analytics Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Choir Attendance &amp; Performance Analytics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Clickable Attendance % Metric Card */}
          <Link
            href="/manage/attendance"
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 relative overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Rate</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {loadingStats ? '...' : `${stats?.attendancePercentage || 100}%`}
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.attendancePercentage || 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Based on {stats?.rehearsalsCount || 0} rehearsal sessions &rarr;</p>
          </Link>

          {/* Clickable Active Members Metric Card */}
          <a
            href="#roster-section"
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Singers</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 group-hover:scale-105 transition-transform">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{activeMembers.length}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{pendingMembers.length} pending join request(s) &rarr;</p>
          </a>

          {/* Clickable Music Library Songs Metric Card */}
          <Link
            href="/songs"
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Songs in Library</span>
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 group-hover:scale-105 transition-transform">
                <Music className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{songs.length}</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Multi-track voice parts uploaded &rarr;</p>
          </Link>

          {/* Clickable Attendance Breakdown Card */}
          <Link
            href="/manage/attendance"
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all cursor-pointer block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Present vs Absent</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 group-hover:scale-105 transition-transform">
                <Clock3 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-900 dark:text-white pt-1">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <UserCheck className="w-4 h-4" /> {stats?.presentCount || 0} Present
              </span>
              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <UserX className="w-4 h-4" /> {stats?.absentCount || 0} Absent
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{stats?.lateCount || 0} late, {stats?.excusedCount || 0} excused &rarr;</p>
          </Link>
        </div>
      </div>

      {/* Admin Action Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link href="/manage/songs/new" className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all space-y-3 group block cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Upload New Song</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Add voice part audio tracks, lyrics &amp; sheet music PDFs</p>
        </Link>

        <Link href="/manage/events/new" className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all space-y-3 group block cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Schedule Event</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Assign Sunday songs to choir &amp; notify singers</p>
        </Link>

        <Link href="/manage/attendance" className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all space-y-3 group block cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Record Attendance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Mark rehearsal &amp; service present/absent statuses</p>
        </Link>

        <Link href="/manage/settings" className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all space-y-3 group block cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 group-hover:scale-105 transition-transform">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Choir Settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure auto-approve, downloads &amp; notifications</p>
        </Link>
      </div>

      {/* Clickable Events Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Manage Choir Events &amp; Services ({events.length})
          </h2>
          <Link
            href="/events"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View Full Calendar →
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400">No events scheduled yet for this choir.</p>
            <Link href="/manage/events/new" className="inline-block text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline">
              + Schedule First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(ev => (
              <div
                key={ev.id}
                className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm transition-all space-y-4 group relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href="/events" className="space-y-1 block flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        ev.status === 'published'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          : ev.status === 'ended'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                      }`}>
                        {ev.status === 'ended' ? '🔚 Ended' : ev.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" /> {ev.event_date} ({ev.start_time})
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {ev.title}
                    </h4>

                    {ev.location && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" /> {ev.location}
                      </p>
                    )}
                  </Link>

                  {/* Card Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ev.status === 'draft' && (
                      <button
                        onClick={(e) => handlePublishEvent(ev.id, e)}
                        disabled={actionId === ev.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
                        title="Publish to Singers"
                      >
                        <Send className="w-3 h-3" /> Publish
                      </button>
                    )}

                    {ev.status === 'published' && (
                      <button
                        onClick={(e) => handleUnpublishEvent(ev.id, e)}
                        disabled={actionId === ev.id}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-xl shadow-md transition-all flex items-center gap-1"
                        title="Unpublish Event"
                      >
                        <EyeOff className="w-3 h-3" /> Unpublish
                      </button>
                    )}

                    <Link
                      href="/events"
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1"
                      title="Edit Event"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </Link>

                    <button
                      onClick={(e) => handleDeleteEvent(ev.id, ev.title, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Approval Requests Section */}
      {pendingMembers.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 p-6 rounded-3xl space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Pending Membership Requests ({pendingMembers.length})
          </h2>
          <div className="space-y-3">
            {pendingMembers.map(m => (
              <div key={m.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm">
                <Link href={`/manage/members/${m.id}`} className="hover:underline flex items-center gap-3">
                  {m.profile?.avatar_url ? (
                    <img src={m.profile.avatar_url} alt={m.profile.full_name} className="w-10 h-10 rounded-xl object-cover border border-blue-200 dark:border-blue-800 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold text-sm flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
                      {m.profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{m.profile?.full_name || 'New Member'}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{m.profile?.email}</span>
                      {m.profile?.phone && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Phone className="w-3 h-3" /> {m.profile.phone}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(m.id, 'active')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Singer
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(m.id, 'rejected')}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clickable Active Choir Roster with Phone Numbers */}
      <div id="roster-section" className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Choir Roster ({activeMembers.length} Singers)</h2>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Click any singer to view individual attendance &amp; song analytics →</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 rounded-l-xl">Singer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 rounded-r-xl">Analytics &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">
                    <Link href={`/manage/members/${m.id}`} className="group-hover:text-blue-600 dark:group-hover:text-blue-400 font-bold hover:underline flex items-center gap-3">
                      {m.profile?.avatar_url ? (
                        <img src={m.profile.avatar_url} alt={m.profile.full_name} className="w-8 h-8 rounded-xl object-cover border border-blue-200 dark:border-blue-800 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800 shrink-0">
                          {m.profile?.full_name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                      )}
                      <span>{m.profile?.full_name}</span>
                    </Link>
                  </td>
                  <td className="p-4 text-xs text-slate-500 dark:text-slate-400">{m.profile?.email}</td>
                  <td className="p-4 text-xs text-blue-600 dark:text-blue-400 font-mono">
                    {m.profile?.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" /> {m.profile.phone}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans italic">Not provided</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2.5 py-1 rounded-md font-semibold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                      {m.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-emerald-400 font-semibold capitalize">{m.status}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/manage/members/${m.id}`}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shrink-0"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> View Analytics
                      </Link>

                      {m.role !== 'owner' && (
                        <button
                          onClick={() => handleUpdateStatus(m.id, 'suspended')}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PlanLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        result={limitCheckResult}
        choirId={activeChoir?.id}
      />
    </div>
  );
}
