import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldAlert,
  Trash2,
  Eye,
  EyeOff,
  UserX,
  Search,
  RefreshCw,
  AlertTriangle,
  Plus,
  X,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { SEO } from '../../components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import { parseJsonResponse } from '../../services/api';

interface AdminComment {
  id: string;
  station_slug: string;
  station_name?: string;
  author_name: string;
  content: string;
  likes_count: number;
  is_hidden: boolean;
  status: string;
  author_fingerprint?: string;
  ip_address?: string;
  created_at: string;
}

interface BannedUser {
  id: string;
  identifier: string;
  identifier_type: string;
  author_name?: string;
  reason?: string;
  banned_by_name?: string;
  created_at: string;
}

export const CommentsModerationAdminPage: React.FC = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState<'comments' | 'banned' | 'words'>('comments');

  // Comments State
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [totalComments, setTotalComments] = useState<number>(0);
  const [loadingComments, setLoadingComments] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'HIDDEN'>('ALL');

  // Ban Modal State
  const [banModalOpen, setBanModalOpen] = useState<boolean>(false);
  const [banTargetComment, setBanTargetComment] = useState<AdminComment | null>(null);
  const [banReasonInput, setBanReasonInput] = useState<string>('Violation of community guidelines');
  const [hideAllInput, setHideAllInput] = useState<boolean>(true);
  const [isBanning, setIsBanning] = useState<boolean>(false);

  // Banned Users State
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [loadingBanned, setLoadingBanned] = useState<boolean>(false);

  // Word List State
  const [kinyarwandaWords, setKinyarwandaWords] = useState<string[]>([]);
  const [englishWords, setEnglishWords] = useState<string[]>([]);
  const [frenchWords, setFrenchWords] = useState<string[]>([]);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [newWordInput, setNewWordInput] = useState<string>('');
  const [loadingWords, setLoadingWords] = useState<boolean>(false);
  const [savingWords, setSavingWords] = useState<boolean>(false);

  // Feedback notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  // 1. Fetch Comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
        limit: '100',
      });

      const res = await fetch(`/api/comments/admin/all?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseJsonResponse(res);
      setComments(data.comments || []);
      setTotalComments(data.total || 0);
    } catch (err: any) {
      showNotification(err.message || 'Network error while loading comments', 'error');
    } finally {
      setLoadingComments(false);
    }
  };

  // 2. Fetch Banned Users
  const fetchBannedUsers = async () => {
    setLoadingBanned(true);
    try {
      const res = await fetch('/api/comments/admin/banned', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseJsonResponse(res);
      setBannedUsers(data.banned || []);
    } catch (err: any) {
      showNotification(err.message || 'Network error while loading banned users', 'error');
    } finally {
      setLoadingBanned(false);
    }
  };

  // 3. Fetch Word Lists
  const fetchWordLists = async () => {
    setLoadingWords(true);
    try {
      const res = await fetch('/api/comments/admin/words', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await parseJsonResponse(res);
      setKinyarwandaWords(data.kinyarwanda || []);
      setEnglishWords(data.english || []);
      setFrenchWords(data.french || []);
      setCustomWords(data.custom || []);
    } catch (err: any) {
      showNotification(err.message || 'Network error while loading word lists', 'error');
    } finally {
      setLoadingWords(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
    } else if (activeTab === 'banned') {
      fetchBannedUsers();
    } else if (activeTab === 'words') {
      fetchWordLists();
    }
  }, [activeTab, statusFilter]);

  // Handle Hide / Show Comment Toggle
  const handleToggleStatus = async (comment: AdminComment) => {
    const newHidden = !comment.is_hidden;
    const newStatus = newHidden ? 'HIDDEN' : 'APPROVED';

    try {
      const res = await fetch(`/api/comments/admin/${comment.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_hidden: newHidden, status: newStatus }),
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) => (c.id === comment.id ? { ...c, is_hidden: newHidden, status: newStatus } : c))
        );
        showNotification(newHidden ? 'Comment hidden from public view' : 'Comment approved and visible');
      }
    } catch (err) {
      showNotification('Error updating comment visibility', 'error');
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this comment and its replies?')) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
        setTotalComments((prev) => Math.max(0, prev - 1));
        showNotification('Comment permanently deleted');
      }
    } catch (err) {
      showNotification('Error deleting comment', 'error');
    }
  };

  // Open Ban Modal
  const openBanModal = (comment: AdminComment) => {
    setBanTargetComment(comment);
    setBanReasonInput('Vulgar language and insensitive nickname');
    setHideAllInput(true);
    setBanModalOpen(true);
  };

  // Submit Ban
  const handleConfirmBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banTargetComment) return;

    setIsBanning(true);
    try {
      const res = await fetch('/api/comments/admin/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          identifier: banTargetComment.author_fingerprint || banTargetComment.ip_address || banTargetComment.author_name,
          identifier_type: banTargetComment.author_fingerprint ? 'fingerprint' : 'author_name',
          author_name: banTargetComment.author_name,
          reason: banReasonInput,
          hide_all_comments: hideAllInput,
        }),
      });

      await parseJsonResponse(res);
      showNotification(`User "${banTargetComment.author_name}" has been banned`);
      setBanModalOpen(false);
      setBanTargetComment(null);
      fetchComments();
    } catch (err: any) {
      showNotification(err.message || 'Failed to ban user', 'error');
    } finally {
      setIsBanning(false);
    }
  };

  // Unban User
  const handleUnban = async (id: string, name?: string) => {
    if (!window.confirm(`Are you sure you want to unban ${name || 'this user'}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/admin/banned/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setBannedUsers((prev) => prev.filter((b) => b.id !== id));
        showNotification(`User ${name || ''} has been unbanned`);
      }
    } catch (err) {
      showNotification('Error unbanning user', 'error');
    }
  };

  // Add Custom Word
  const handleAddCustomWord = () => {
    const trimmed = newWordInput.trim().toLowerCase();
    if (!trimmed) return;

    if (customWords.includes(trimmed)) {
      showNotification('Word is already in the custom blocked list', 'error');
      return;
    }

    setCustomWords((prev) => [...prev, trimmed]);
    setNewWordInput('');
  };

  // Remove Custom Word
  const handleRemoveCustomWord = (word: string) => {
    setCustomWords((prev) => prev.filter((w) => w !== word));
  };

  // Save Custom Words to DB
  const handleSaveCustomWords = async () => {
    setSavingWords(true);
    try {
      const res = await fetch('/api/comments/admin/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ words: customWords }),
      });

      if (res.ok) {
        showNotification('Custom blocked words list saved successfully!');
      } else {
        showNotification('Failed to save words list', 'error');
      }
    } catch (err) {
      showNotification('Error saving words list', 'error');
    } finally {
      setSavingWords(false);
    }
  };

  const hiddenCount = comments.filter((c) => c.is_hidden).length;

  return (
    <AdminLayout>
      <SEO title="Comments & Moderation | Benix Admin" />

      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
        
        {/* Header Title & Notification */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-rba-blue/10 text-rba-blue">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Comments & Moderation
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Manage live discussion comments, ban abusive viewers, and configure multilingual name & comment word filters.
            </p>
          </div>

          {notice && (
            <div
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 animate-fadeIn ${
                notice.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{notice.message}</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-rba-blue flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Comments</p>
              <h3 className="text-2xl font-black text-slate-900">{totalComments}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <EyeOff className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hidden / Filtered</p>
              <h3 className="text-2xl font-black text-slate-900">{hiddenCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Banned Users</p>
              <h3 className="text-2xl font-black text-slate-900">{bannedUsers.length}</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Words</p>
              <h3 className="text-2xl font-black text-slate-900">
                {kinyarwandaWords.length + englishWords.length + frenchWords.length + customWords.length || 70}
              </h3>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('comments')}
            className={`pb-3 text-sm font-black border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'border-rba-blue text-rba-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Live Comments ({totalComments})
          </button>

          <button
            onClick={() => setActiveTab('banned')}
            className={`pb-3 text-sm font-black border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'banned'
                ? 'border-rba-blue text-rba-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserX className="w-4 h-4" />
            Banned Commenters ({bannedUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('words')}
            className={`pb-3 text-sm font-black border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'words'
                ? 'border-rba-blue text-rba-blue'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            Moderation Word Lists (Kinyarwanda / EN / FR)
          </button>
        </div>

        {/* TAB 1: COMMENTS LIST */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchComments()}
                  placeholder="Search author name or comment text..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rba-blue"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rba-blue"
                >
                  <option value="ALL">All Comments</option>
                  <option value="APPROVED">Approved Only</option>
                  <option value="HIDDEN">Hidden Only</option>
                </select>

                <button
                  onClick={fetchComments}
                  disabled={loadingComments}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingComments ? 'animate-spin text-rba-blue' : ''}`} />
                </button>
              </div>
            </div>

            {/* Comments Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4">Author</th>
                      <th className="py-3.5 px-4">Channel / Station</th>
                      <th className="py-3.5 px-4">Comment Content</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingComments ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rba-blue" />
                          <span>Loading comments...</span>
                        </td>
                      </tr>
                    ) : comments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <span>No comments found matching your filters.</span>
                        </td>
                      </tr>
                    ) : (
                      comments.map((comment) => (
                        <tr key={comment.id} className={`hover:bg-slate-50/80 transition ${comment.is_hidden ? 'bg-red-50/30' : ''}`}>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{comment.author_name}</span>
                            </div>
                            {comment.author_fingerprint && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {comment.author_fingerprint.slice(0, 10)}...
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                              {comment.station_name || comment.station_slug}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                            <p className="text-slate-800 leading-relaxed break-words line-clamp-2">
                              {comment.content}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            {comment.is_hidden ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase">
                                Hidden
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase">
                                Approved
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {new Date(comment.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Toggle visibility */}
                              <button
                                onClick={() => handleToggleStatus(comment)}
                                className={`p-1.5 rounded-lg border transition ${
                                  comment.is_hidden
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                                title={comment.is_hidden ? 'Approve / Show' : 'Hide comment'}
                              >
                                {comment.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>

                              {/* Ban User */}
                              <button
                                onClick={() => openBanModal(comment)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                                title={`Ban ${comment.author_name}`}
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Comment */}
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                                title="Delete comment permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BANNED COMMENTERS */}
        {activeTab === 'banned' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Banned Viewers</h3>
                <p className="text-xs text-slate-500">Users blocked from posting comments on Benix Space TV</p>
              </div>
              <button
                onClick={fetchBannedUsers}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBanned ? 'animate-spin text-rba-blue' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Author / Nickname</th>
                    <th className="py-3.5 px-4">Device Fingerprint / IP</th>
                    <th className="py-3.5 px-4">Ban Reason</th>
                    <th className="py-3.5 px-4">Banned By</th>
                    <th className="py-3.5 px-4">Date Banned</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingBanned ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rba-blue" />
                        <span>Loading banned users...</span>
                      </td>
                    </tr>
                  ) : bannedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Shield className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                        <span>No users are currently banned.</span>
                      </td>
                    </tr>
                  ) : (
                    bannedUsers.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {b.author_name || 'Anonymous User'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {b.identifier}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs">
                          {b.reason || 'Violation of rules'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {b.banned_by_name || 'Admin'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(b.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleUnban(b.id, b.author_name)}
                            className="px-3 py-1 rounded-xl font-black text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                          >
                            Unban User
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MODERATION WORD LISTS */}
        {activeTab === 'words' && (
          <div className="space-y-6">
            
            {/* Custom Blocked Words Section */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-rba-blue" />
                    Custom Blocked Words & Phrases
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add custom words or slang to immediately prohibit them from being used in names or comments.
                  </p>
                </div>

                <button
                  onClick={handleSaveCustomWords}
                  disabled={savingWords}
                  className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rba-blue hover:bg-rba-navy text-white text-xs font-black shadow-md transition disabled:opacity-50"
                >
                  {savingWords ? 'Saving...' : 'Save Word List Changes'}
                </button>
              </div>

              {/* Input row */}
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newWordInput}
                  onChange={(e) => setNewWordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomWord();
                    }
                  }}
                  placeholder="Type word or phrase and click Add..."
                  className="flex-1 px-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rba-blue"
                />
                <button
                  type="button"
                  onClick={handleAddCustomWord}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                >
                  Add
                </button>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 pt-2 min-h-[40px]">
                {customWords.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No custom words added yet.</span>
                ) : (
                  customWords.map((word) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold"
                    >
                      <span>{word}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomWord(word)}
                        className="hover:text-rose-900"
                        title="Remove word"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Built-in Multilingual Dictionaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Kinyarwanda Dictionary */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    🇷🇼 Kinyarwanda Filter
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    {kinyarwandaWords.length} terms
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Insensitive terms, profanity, and vulgar anatomy in Kinyarwanda.
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {kinyarwandaWords.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              {/* English Dictionary */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    🇬🇧 English Filter
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    {englishWords.length} terms
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Common English profanity, slurs, and offensive words.
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {englishWords.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              {/* French Dictionary */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                    🇫🇷 French Filter
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    {frenchWords.length} terms
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  French vulgarities, insults, and inappropriate terms.
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {frenchWords.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* BAN USER MODAL */}
      {banModalOpen && banTargetComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
              <button
                onClick={() => setBanModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Ban Commenter
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Restrict <strong className="text-slate-900">{banTargetComment.author_name}</strong> from participating in live chats.
              </p>
            </div>

            <form onSubmit={handleConfirmBan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Reason for Ban
                </label>
                <input
                  type="text"
                  required
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="e.g., Inappropriate language and offensive nickname"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="text-slate-500">
                  <strong>Identifier:</strong>{' '}
                  <span className="font-mono text-[11px]">
                    {banTargetComment.author_fingerprint || banTargetComment.ip_address || banTargetComment.author_name}
                  </span>
                </p>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={hideAllInput}
                  onChange={(e) => setHideAllInput(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span>Automatically hide all comments by this user</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBanModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBanning}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 transition disabled:opacity-50"
                >
                  {isBanning ? 'Banning...' : 'Confirm Ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};
