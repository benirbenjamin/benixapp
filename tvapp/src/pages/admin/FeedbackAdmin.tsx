import React, { useEffect, useState } from 'react';
import {
  Mail,
  Inbox,
  Search,
  CheckCircle2,
  Archive,
  Trash2,
  RefreshCw,
  Clock,
  User,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Eye,
  X,
  Filter,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { FeedbackMessage } from '../../types';
import { getAdminFeedback, updateFeedbackStatus, deleteFeedbackMessage } from '../../services/api';

export const FeedbackAdminPage: React.FC = () => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'READ' | 'ARCHIVED'>('UNREAD');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<FeedbackMessage | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const data = await getAdminFeedback({
        status: activeTab,
        q: searchTerm,
      });
      setMessages(data.messages);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load feedback messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeedback();
  };

  const handleStatusChange = async (id: string, newStatus: 'UNREAD' | 'READ' | 'ARCHIVED') => {
    setActionLoading(id);
    try {
      const result = await updateFeedbackStatus(id, newStatus);
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(result.message);
      }
      await fetchFeedback();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback message?')) return;
    setActionLoading(id);
    try {
      await deleteFeedbackMessage(id);
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
      await fetchFeedback();
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const openMessageDetail = async (msg: FeedbackMessage) => {
    setSelectedMessage(msg);
    if (msg.status === 'UNREAD') {
      await handleStatusChange(msg.id, 'READ');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Feedback & User Inquiries
              </h1>
              {stats.unread > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white font-black text-xs animate-pulse">
                  {stats.unread} NEW
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Direct audience feedback, news tips, and broadcasting inquiries sent via website forms
            </p>
          </div>

          <button
            onClick={fetchFeedback}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rba-blue' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('UNREAD')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'UNREAD'
                ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-600 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${activeTab === 'UNREAD' ? 'text-red-100' : 'text-slate-500'}`}>
                Unread Messages
              </span>
              <Inbox className={`w-4 h-4 ${activeTab === 'UNREAD' ? 'text-white' : 'text-red-500'}`} />
            </div>
            <div className="text-2xl font-black">{stats.unread}</div>
          </button>

          <button
            onClick={() => setActiveTab('READ')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'READ'
                ? 'bg-gradient-to-br from-rba-blue to-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${activeTab === 'READ' ? 'text-blue-100' : 'text-slate-500'}`}>
                Read Messages
              </span>
              <CheckCircle2 className={`w-4 h-4 ${activeTab === 'READ' ? 'text-white' : 'text-rba-blue'}`} />
            </div>
            <div className="text-2xl font-black">{stats.read}</div>
          </button>

          <button
            onClick={() => setActiveTab('ARCHIVED')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'ARCHIVED'
                ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-slate-800 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${activeTab === 'ARCHIVED' ? 'text-slate-300' : 'text-slate-500'}`}>
                Archived
              </span>
              <Archive className={`w-4 h-4 ${activeTab === 'ARCHIVED' ? 'text-white' : 'text-slate-600'}`} />
            </div>
            <div className="text-2xl font-black">{stats.archived}</div>
          </button>

          <button
            onClick={() => setActiveTab('ALL')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'ALL'
                ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-purple-700 shadow-md scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${activeTab === 'ALL' ? 'text-purple-100' : 'text-slate-500'}`}>
                Total Received
              </span>
              <MessageSquare className={`w-4 h-4 ${activeTab === 'ALL' ? 'text-white' : 'text-purple-600'}`} />
            </div>
            <div className="text-2xl font-black">{stats.total}</div>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {(['UNREAD', 'READ', 'ARCHIVED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'UNREAD' && `Unread (${stats.unread})`}
                {tab === 'READ' && `Read (${stats.read})`}
                {tab === 'ARCHIVED' && `Archived (${stats.archived})`}
                {tab === 'ALL' && `All (${stats.total})`}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sender, email, subject..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rba-blue"
            />
          </form>
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-rba-blue border-t-transparent mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-semibold">Loading feedback messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-extrabold text-slate-700 text-base">No feedback messages found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeTab === 'UNREAD'
                  ? 'All clear! No unread user messages or inquiries right now.'
                  : 'No feedback entries match your current search or status filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Sender</th>
                    <th className="py-3.5 px-4">Subject & Message</th>
                    <th className="py-3.5 px-4">Received Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {messages.map((msg) => {
                    const isUnread = msg.status === 'UNREAD';
                    return (
                      <tr
                        key={msg.id}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isUnread ? 'bg-amber-50/40 font-semibold' : ''
                        }`}
                        onClick={() => openMessageDetail(msg)}
                      >
                        <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              msg.status === 'UNREAD'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : msg.status === 'READ'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                msg.status === 'UNREAD'
                                  ? 'bg-red-500 animate-ping'
                                  : msg.status === 'READ'
                                  ? 'bg-emerald-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {msg.status}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rba-navy text-white font-black text-xs flex items-center justify-center shrink-0">
                              {msg.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-slate-900 truncate ${isUnread ? 'font-black' : 'font-bold'}`}>
                                {msg.name}
                              </p>
                              <a
                                href={`mailto:${msg.email}?subject=RE: ${encodeURIComponent(msg.subject)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-rba-blue hover:underline flex items-center gap-1 truncate"
                              >
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="truncate">{msg.email}</span>
                              </a>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 max-w-xs sm:max-w-md">
                          <p className={`text-slate-900 truncate ${isUnread ? 'font-extrabold' : 'font-semibold'}`}>
                            {msg.subject}
                          </p>
                          <p className="text-slate-500 text-[11px] truncate mt-0.5">{msg.message}</p>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{new Date(msg.created_at).toLocaleString()}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openMessageDetail(msg)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rba-blue hover:text-white text-slate-600 transition-colors"
                              title="Read Message"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {msg.status !== 'ARCHIVED' ? (
                              <button
                                onClick={() => handleStatusChange(msg.id, 'ARCHIVED')}
                                disabled={actionLoading === msg.id}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-600 transition-colors"
                                title="Archive"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(msg.id, 'READ')}
                                disabled={actionLoading === msg.id}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 transition-colors"
                                title="Unarchive"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(msg.id)}
                              disabled={actionLoading === msg.id}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Message View Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-800 relative">
              
              {/* Modal Header */}
              <div className="bg-rba-navy text-white p-6 relative">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-0.5 rounded-md bg-rba-blue/30 text-rba-blueLight text-[10px] font-bold uppercase tracking-wider border border-rba-blue/40">
                  {selectedMessage.status}
                </span>
                <h2 className="text-xl font-black mt-2 leading-snug">{selectedMessage.subject}</h2>
                <p className="text-xs text-slate-300 mt-1">
                  Received {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                
                {/* Sender Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rba-blue text-white font-black text-sm flex items-center justify-center">
                      {selectedMessage.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{selectedMessage.name}</h4>
                      <p className="text-xs text-slate-500">{selectedMessage.email}</p>
                    </div>
                  </div>

                  <a
                    href={`mailto:${selectedMessage.email}?subject=RE: ${encodeURIComponent(selectedMessage.subject)}`}
                    className="px-4 py-2 rounded-xl bg-rba-blue hover:bg-rba-blueHover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Message Body</h4>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Additional Telemetry */}
                {selectedMessage.ip_address && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Sender IP: {selectedMessage.ip_address}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedMessage.status !== 'UNREAD' && (
                    <button
                      onClick={() => handleStatusChange(selectedMessage.id, 'UNREAD')}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Mark Unread
                    </button>
                  )}
                  {selectedMessage.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => handleStatusChange(selectedMessage.id, 'ARCHIVED')}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Archive Message
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors"
                  >
                    Delete Message
                  </button>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
