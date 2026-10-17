import React, { useState, useEffect } from 'react';
import { api } from '../../../api/client';
import {
  Radio,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  User,
  Mail,
  Phone,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Building2,
  MessageSquare,
  Sparkles,
  Check,
  X
} from 'lucide-react';

export function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | approved | rejected
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [approveModalRequest, setApproveModalRequest] = useState(null);
  const [rejectModalRequest, setRejectModalRequest] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Stream preview playback
  const [playingStreamUrl, setPlayingStreamUrl] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/superadmin/requests');
      setRequests(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load radio listing requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveModalRequest) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.put(`/superadmin/requests/${approveModalRequest.id}/approve`, {});
      setSuccessMessage(`Radio station "${approveModalRequest.radio_name}" approved successfully! Station admin created.`);
      setApproveModalRequest(null);
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to approve radio request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModalRequest) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.put(`/superadmin/requests/${rejectModalRequest.id}/reject`, {
        admin_notes: rejectNotes.trim(),
      });
      setSuccessMessage(`Request for "${rejectModalRequest.radio_name}" rejected. Notice sent to applicant.`);
      setRejectModalRequest(null);
      setRejectNotes('');
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Failed to reject radio request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Audio stream toggle preview
  const toggleAudio = (url) => {
    if (playingStreamUrl === url) {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      setPlayingStreamUrl(null);
      setAudioElement(null);
    } else {
      if (audioElement) {
        audioElement.pause();
      }
      const audio = new Audio(url);
      audio.play().catch((err) => {
        alert('Could not play stream audio preview. URL may be offline or mixed content.');
      });
      setAudioElement(audio);
      setPlayingStreamUrl(url);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      r.radio_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.slogan?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">Radio Station Requests</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review submissions from radio owners. Approving automatically provisions their station and assigns them as Station Administrator.
          </p>
        </div>

        <button
          onClick={loadRequests}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs self-start sm:self-auto"
        >
          Refresh List
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved ({approvedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by radio, name, email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Requests Content */}
      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
          Loading radio listing applications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
          <Radio className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm font-medium">No radio listing applications found.</p>
          <p className="text-xs text-slate-400">Applications submitted through the website will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => {
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'approved';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Header row: Station info & status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    {req.radio_logo_link ? (
                      <img
                        src={req.radio_logo_link}
                        alt={req.radio_name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <Radio className="w-7 h-7" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900">{req.radio_name}</h3>
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase tracking-wide">
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 uppercase tracking-wide">
                            Rejected
                          </span>
                        )}
                      </div>
                      {req.slogan && (
                        <p className="text-xs text-indigo-600 font-semibold mt-0.5">{req.slogan}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Submitted on {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Pending Requests */}
                  {isPending && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setRejectNotes('');
                          setRejectModalRequest(req);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => setApproveModalRequest(req)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve & Assign</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Body Details: Grid of Applicant & Description */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  
                  {/* Applicant Details (5 cols) */}
                  <div className="md:col-span-5 bg-slate-50 p-3.5 rounded-xl space-y-2 border border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Applicant Information
                    </span>
                    <div className="flex items-center gap-2 text-slate-800 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.names}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${req.email}`} className="hover:underline text-indigo-600">{req.email}</a>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.phonenumber}</span>
                    </div>
                  </div>

                  {/* Description & Audio Stream (7 cols) */}
                  <div className="md:col-span-7 space-y-3">
                    {req.description && (
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Description / Bio
                        </span>
                        <p className="text-slate-700 leading-relaxed text-xs">{req.description}</p>
                      </div>
                    )}

                    {/* Stream URL & Audio Preview */}
                    {req.stream_url ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                        <div className="truncate max-w-[70%]">
                          <span className="text-[10px] font-bold text-indigo-700 block">Stream Server URL</span>
                          <span className="text-[11px] font-mono text-indigo-900 truncate block">
                            {req.stream_url}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAudio(req.stream_url)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            playingStreamUrl === req.stream_url
                              ? 'bg-rose-600 text-white'
                              : 'bg-indigo-600 text-white hover:bg-indigo-500'
                          }`}
                        >
                          {playingStreamUrl === req.stream_url ? (
                            <>
                              <Pause className="w-3 h-3" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              <span>Test Audio</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No stream URL specified.</p>
                    )}
                  </div>

                </div>

                {/* Footer status notes */}
                {isApproved && req.station_id && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Provisioned Station ID: <strong className="font-mono text-slate-700">{req.station_id}</strong></span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Station Administrator Assigned
                    </span>
                  </div>
                )}

                {isRejected && req.admin_notes && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800">
                    <strong className="block mb-0.5">Admin Feedback sent to applicant:</strong>
                    <p>{req.admin_notes}</p>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {approveModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Approve Radio Station</h3>
                <p className="text-xs text-slate-500">Provision station and promote user</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
              <p>
                You are about to approve <strong>"{approveModalRequest.radio_name}"</strong>.
              </p>
              <p className="font-semibold text-slate-800">Upon approval, the system will automatically:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Create the radio station record with logo, slogan, and stream.</li>
                <li>Upgrade user <strong>{approveModalRequest.email}</strong> to <strong>stationadmin</strong>.</li>
                <li>Assign the user to manage this station.</li>
                <li>Dispatch an approval confirmation email to the applicant.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setApproveModalRequest(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{actionLoading ? 'Approving...' : 'Confirm & Approve'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Reject Radio Request</h3>
                <p className="text-xs text-slate-500">Provide feedback to the applicant</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Rejecting request for <strong>"{rejectModalRequest.radio_name}"</strong>. An email notification will be sent to <strong>{rejectModalRequest.email}</strong>.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reason for Rejection / Feedback Note (Optional):
                </label>
                <textarea
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="e.g. Please upload a high-resolution logo and verify that your stream URL is working properly before reapplying."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  setRejectModalRequest(null);
                  setRejectNotes('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleReject}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                <span>{actionLoading ? 'Rejecting...' : 'Reject Application'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
export default AdminRequestsPage;
