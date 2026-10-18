import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/AdminLayout';
import {
  fetchArticles,
  deleteArticle,
  updateArticleStatus,
  fetchAllCommentsAdmin,
  updateCommentStatusApi,
  deleteCommentApi,
  banUserIpApi,
  postArticleComment
} from '../../services/api';
import { Article, ArticleComment } from '../../types';
import {
  Plus, Edit, Trash2, Eye, CheckCircle2, AlertTriangle, MessageSquare, ShieldCheck, EyeOff, Ban, CornerDownRight, FileText
} from 'lucide-react';

export const AdminBlogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'articles' | 'comments'>('articles');
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<(ArticleComment & { article_title?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin reply modal state
  const [replyModalTarget, setReplyModalTarget] = useState<ArticleComment | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [articleData, commentData] = await Promise.all([
        fetchArticles({ status: 'all' }),
        fetchAllCommentsAdmin()
      ]);
      setArticles(articleData);
      setComments(commentData as any);
    } catch (err) {
      console.error('Failed to load admin blog data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveArticle = async (id: number) => {
    try {
      await updateArticleStatus(id, 'published');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve article.');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteArticle(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete article.');
    }
  };

  // Comment Moderation Actions
  const handleToggleCommentStatus = async (commentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'approved' ? 'hidden' : 'approved';
    try {
      await updateCommentStatusApi(commentId, nextStatus);
      loadData();
    } catch (err) {
      alert('Failed to update comment status.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this comment and its replies?')) return;
    try {
      await deleteCommentApi(commentId);
      loadData();
    } catch (err) {
      alert('Failed to delete comment.');
    }
  };

  const handleBanUserIp = async (ip?: string) => {
    if (!ip) {
      alert('User IP address not available.');
      return;
    }
    if (!window.confirm(`Are you sure you want to ban user IP address (${ip}) from submitting comments?`)) return;
    try {
      await banUserIpApi(ip);
      alert(`User IP ${ip} has been banned.`);
      loadData();
    } catch (err) {
      alert('Failed to ban user IP.');
    }
  };

  const handlePostAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalTarget || !adminReplyText.trim()) return;
    setReplySubmitting(true);
    try {
      await postArticleComment({
        article_id: Number(replyModalTarget.article_id),
        parent_id: replyModalTarget.id,
        author_name: 'Benir Benjamin (NebeluRw Staff)',
        content: adminReplyText.trim(),
        is_admin_reply: true
      });
      setAdminReplyText('');
      setReplyModalTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to post admin reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Blog & Editorial CMS</h1>
            <p className="text-slate-400 text-sm">Publish articles, review submissions, and moderate public comments.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/blog/new"
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New Article
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'articles'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-[#131926] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Articles List ({articles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'comments'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-[#131926] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comment Moderation ({comments.length})</span>
          </button>
        </div>

        {/* TAB 1: ARTICLES LIST */}
        {activeTab === 'articles' && (
          <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#131926]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#182236] text-slate-300 text-xs uppercase font-extrabold border-b border-slate-800">
                    <th className="p-4">Article Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Loading articles...</td>
                    </tr>
                  ) : articles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No articles published yet. Click "Create New Article".</td>
                    </tr>
                  ) : (
                    articles.map((art) => (
                      <tr key={art.id} className="hover:bg-[#1A243A]/60 transition-colors">
                        <td className="p-4 font-bold text-white">
                          <div className="flex items-center gap-3">
                            <img src={art.featured_image_url || 'https://i.postimg.cc/85zP6mK2/benix-tv-cover.jpg'} alt={art.title} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-700" />
                            <div className="truncate max-w-xs">
                              <span className="block truncate text-white">{art.title}</span>
                              <span className="text-[11px] text-slate-400 font-mono">/blog/{art.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-300 text-xs font-semibold">{art.category}</td>
                        <td className="p-4 text-slate-300 text-xs font-semibold">{art.author_name}</td>
                        <td className="p-4">
                          {art.status === 'published' ? (
                            <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Published
                            </span>
                          ) : art.status === 'pending_review' ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Pending Review
                              </span>
                              <button
                                onClick={() => handleApproveArticle(art.id)}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs px-3 py-1 rounded-full font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Link
                            to={`/blog/${art.slug}`}
                            target="_blank"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white inline-flex transition-colors border border-slate-700/60"
                            title="View Live Article"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/blog/edit/${art.id}`}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 inline-flex transition-colors border border-slate-700/60"
                            title="Edit Article"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 transition-colors border border-slate-700/60"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* TAB 2: COMMENT MODERATION CENTER */}
        {activeTab === 'comments' && (
          <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#131926]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#182236] text-slate-300 text-xs uppercase font-extrabold border-b border-slate-800">
                    <th className="p-4">Author & IP</th>
                    <th className="p-4">Article</th>
                    <th className="p-4">Comment Body</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Loading comments...</td>
                    </tr>
                  ) : comments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No comments posted yet.</td>
                    </tr>
                  ) : (
                    comments.map((c) => (
                      <tr key={c.id} className="hover:bg-[#1A243A]/60 transition-colors">
                        <td className="p-4 font-bold text-white">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white">{c.author_name}</span>
                              {c.is_admin_reply && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-extrabold">Staff</span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 block">{c.user_ip || '127.0.0.1'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-300 max-w-xs truncate">
                          {c.article_title || `Article #${c.article_id}`}
                        </td>
                        <td className="p-4 text-xs text-slate-300 max-w-md">
                          <p className="line-clamp-2 leading-relaxed">{c.content}</p>
                        </td>
                        <td className="p-4">
                          {c.status === 'approved' ? (
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Approved
                            </span>
                          ) : (
                            <span className="text-[11px] px-2.5 py-1 rounded-full font-extrabold bg-red-500/20 text-red-400 border border-red-500/30">
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-1.5">
                          <button
                            onClick={() => setReplyModalTarget(c)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition-colors border border-slate-700/60"
                            title="Reply as Admin"
                          >
                            <CornerDownRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleCommentStatus(c.id, c.status)}
                            className={`p-2 rounded-xl transition-colors border border-slate-700/60 ${
                              c.status === 'approved' ? 'bg-slate-800 hover:bg-amber-500 hover:text-white text-slate-300' : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                            }`}
                            title={c.status === 'approved' ? 'Hide Comment' : 'Unhide / Approve Comment'}
                          >
                            {c.status === 'approved' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleBanUserIp(c.user_ip)}
                            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-600 hover:text-white text-amber-400 transition-colors border border-amber-500/20"
                            title="Ban User IP"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 transition-colors border border-red-500/20"
                            title="Delete Comment"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* ADMIN REPLY MODAL */}
        {replyModalTarget && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#131926] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4 border border-slate-800 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base">
                  Reply as Admin to {replyModalTarget.author_name}
                </h3>
                <button onClick={() => setReplyModalTarget(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="p-3 bg-[#1A2234] rounded-2xl border border-slate-800 text-xs text-slate-300 italic">
                "{replyModalTarget.content}"
              </div>

              <form onSubmit={handlePostAdminReply} className="space-y-4">
                <textarea
                  rows={4}
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  placeholder="Write your official response as BenixSpace Admin..."
                  className="w-full p-3 rounded-2xl bg-[#1A2234] border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:border-blue-500"
                  required
                  autoFocus
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyModalTarget(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={replySubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                  >
                    {replySubmitting ? 'Posting...' : 'Post Admin Reply'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
