import React, { useEffect, useState } from 'react';
import { ArticleComment } from '../../types';
import { fetchArticleComments, postArticleComment, likeArticleComment } from '../../services/api';
import { containsProfanity, getDetectedProfaneWords } from '../../utils/moderation';
import { MessageSquare, ThumbsUp, Reply, ShieldCheck, AlertTriangle, Send, User, CheckCircle2 } from 'lucide-react';

interface CommentSectionProps {
  articleId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ articleId }) => {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for root comment with localStorage persistence
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('benix_comment_author_name') || '';
  });
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Inline reply states
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyName, setReplyName] = useState(() => {
    return localStorage.getItem('benix_comment_author_name') || '';
  });
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleNameChange = (val: string) => {
    setAuthorName(val);
    localStorage.setItem('benix_comment_author_name', val);
  };

  const handleReplyNameChange = (val: string) => {
    setReplyName(val);
    localStorage.setItem('benix_comment_author_name', val);
  };

  // Profanity detection warnings
  const nameHasProfanity = containsProfanity(authorName);
  const contentHasProfanity = containsProfanity(content);
  const replyNameHasProfanity = containsProfanity(replyName);
  const replyContentHasProfanity = containsProfanity(replyContent);

  const loadComments = async () => {
    try {
      const data = await fetchArticleComments(articleId);
      setComments(data);
    } catch (err) {
      console.error('Failed to load article comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!authorName.trim() || !content.trim()) {
      setErrorMsg('Please provide both your name and comment message.');
      return;
    }

    if (nameHasProfanity || contentHasProfanity) {
      const badWords = [
        ...getDetectedProfaneWords(authorName),
        ...getDetectedProfaneWords(content)
      ];
      setErrorMsg(
        `Inappropriate language detected (${badWords.join(', ')}). Comments must adhere to community standards in English, Kinyarwanda, and French.`
      );
      return;
    }

    setSubmitting(true);
    try {
      await postArticleComment({
        article_id: articleId,
        author_name: authorName.trim(),
        content: content.trim()
      });
      setContent('');
      setSuccessMsg('Your comment has been posted successfully!');
      loadComments();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    setErrorMsg('');
    if (!replyName.trim() || !replyContent.trim()) {
      alert('Please provide your name and reply message.');
      return;
    }

    if (replyNameHasProfanity || replyContentHasProfanity) {
      alert('Your reply contains restricted language in English, Kinyarwanda, or French. Please revise.');
      return;
    }

    setReplySubmitting(true);
    try {
      await postArticleComment({
        article_id: articleId,
        parent_id: parentId,
        author_name: replyName.trim(),
        content: replyContent.trim()
      });
      setReplyContent('');
      setReplyTargetId(null);
      loadComments();
    } catch (err: any) {
      alert(err.message || 'Failed to post reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    try {
      const newLikes = await likeArticleComment(commentId);
      setComments((prev) => updateLikesInTree(prev, commentId, newLikes));
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const updateLikesInTree = (list: ArticleComment[], targetId: string, newCount: number): ArticleComment[] => {
    return list.map((item) => {
      if (item.id === targetId) {
        return { ...item, likes_count: newCount };
      }
      if (item.replies && item.replies.length > 0) {
        return { ...item, replies: updateLikesInTree(item.replies, targetId, newCount) };
      }
      return item;
    });
  };

  const renderCommentItem = (comment: ArticleComment, depth: number = 0) => {
    const isReplyingThis = replyTargetId === comment.id;

    return (
      <div key={comment.id} className={`space-y-3 ${depth > 0 ? 'ml-4 sm:ml-8 pl-4 border-l-2 border-sky-100' : ''}`}>
        <div className="glass-card rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3 bg-white/90">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                comment.is_admin_reply ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {comment.author_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{comment.author_name}</h4>
                  {comment.is_admin_reply && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200">
                      <ShieldCheck className="w-3 h-3 text-sky-600" /> NebeluRw Staff
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(comment.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLike(comment.id)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 transition-colors bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="font-bold">{comment.likes_count || 0}</span>
              </button>

              <button
                onClick={() => {
                  setReplyTargetId(isReplyingThis ? null : comment.id);
                  if (!replyName && authorName) setReplyName(authorName);
                }}
                className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-semibold bg-sky-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>
          </div>

          <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line pl-1">
            {comment.content}
          </p>
        </div>

        {/* Inline Reply Form */}
        {isReplyingThis && (
          <div className="ml-4 sm:ml-8 p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-3">
            <h5 className="text-xs font-bold text-sky-900 uppercase">Replying to {comment.author_name}</h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={replyName}
                onChange={(e) => setReplyName(e.target.value)}
                placeholder="Your Name..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <textarea
              rows={2}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Write a reply to ${comment.author_name}...`}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white leading-relaxed"
            />

            {(replyNameHasProfanity || replyContentHasProfanity) && (
              <div className="p-2 rounded-xl bg-amber-50 text-amber-800 text-[11px] flex items-center gap-1.5 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Inappropriate language detected in English, Kinyarwanda, or French.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplyTargetId(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={replySubmitting || replyNameHasProfanity || replyContentHasProfanity}
                className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {replySubmitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </div>
        )}

        {/* Recursive Sub-Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3 pt-1">
            {comment.replies.map((sub) => renderCommentItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl space-y-8 bg-white/95">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-100 text-sky-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Public Discussion & Comments</h3>
            <p className="text-slate-500 text-xs">Share your thoughts. Clean & moderated discourse.</p>
          </div>
        </div>
      </div>

      {/* Main Comment Input Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4 bg-slate-50/80 p-6 rounded-2xl border border-slate-200/70">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Leave a Comment</h4>
        
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span>Your Full Name</span>
            {authorName && (
              <span className="text-[10px] text-sky-600 font-medium bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                Saved in browser — editable anytime
              </span>
            )}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={authorName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your name (e.g., Eric Nshuti)"
              className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
                nameHasProfanity ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
              }`}
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600">Your Comment</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article feedback or thought here..."
            className={`w-full p-3.5 rounded-xl bg-white border text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
              contentHasProfanity ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'
            }`}
            required
          />
        </div>

        {/* Profanity Warning Alert */}
        {(nameHasProfanity || contentHasProfanity) && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs flex items-start gap-2.5 border border-red-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <span className="font-bold">Restricted Words Detected!</span>
              <p className="text-[11px] mt-0.5 text-red-600">
                Your input contains inappropriate words in English, Kinyarwanda, or French. Please remove them before submitting.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 font-medium">
            Multilingual Automated Moderation Active
          </span>
          <button
            type="submit"
            disabled={submitting || nameHasProfanity || contentHasProfanity}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Submit Comment</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-6 pt-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Comments ({comments.length})
        </h4>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No comments yet. Be the first to start the discussion!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => renderCommentItem(comment))}
          </div>
        )}
      </div>

    </div>
  );
};
