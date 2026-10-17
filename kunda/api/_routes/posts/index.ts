// =====================================================================
// GET, POST, DELETE /api/posts - Community Feed Posts & Interactions
// =====================================================================
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import {
  memoryStore,
  loadFeedAndStoriesFromDb,
  savePostToDb,
  deletePostFromDb,
  savePostCommentToDb,
  savePostLikeToDb,
  deletePostLikeFromDb,
} from '../../_lib/db.js';

export default async function handler(req: any, res: any) {
  // Always ensure posts are loaded from persistent database
  await loadFeedAndStoriesFromDb().catch(() => {});

  // 1. GET: Fetch community feed posts with author profiles and counts
  if (req.method === 'GET') {
    const auth = extractAuthUser(req);
    const postsList = [...(memoryStore.posts || [])].reverse();

    const formattedPosts = postsList.map((post) => {
      const authorProfile = memoryStore.profiles.find((p) => p.userId === post.userId);
      const authorUser = memoryStore.users.find((u) => u.id === post.userId);

      const isLiked = Boolean(
        auth?.userId &&
          (memoryStore.postLikes || []).some(
            (l) => l.postId === post.id && l.userId === auth.userId
          )
      );

      const comments = (memoryStore.postComments || [])
        .filter((c) => c.postId === post.id)
        .map((c) => {
          const commentUser = memoryStore.profiles.find((p) => p.userId === c.userId);
          return {
            id: c.id,
            userId: c.userId,
            userName: commentUser?.displayName || c.userName || 'Member',
            userAvatar: commentUser?.photos?.[0] || c.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            content: c.content,
            createdAt: c.createdAt,
          };
        });

      return {
        id: post.id,
        userId: post.userId,
        caption: post.caption || '',
        mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
        feeling: post.feeling || null,
        location: post.location || authorProfile?.city || 'Rwanda',
        likesCount: post.likesCount || 0,
        commentsCount: comments.length,
        isLiked,
        comments,
        createdAt: post.createdAt,
        author: {
          id: post.userId,
          displayName: authorProfile?.displayName || authorUser?.email?.split('@')[0] || 'Member',
          avatar: authorProfile?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          verifiedBadge: Boolean(authorProfile?.verifiedBadge),
          city: authorProfile?.city || 'Kigali',
        },
      };
    });

    return res.status(200).json({
      success: true,
      posts: formattedPosts,
    });
  }

  // 2. POST: Create post, like post, or add comment
  if (req.method === 'POST') {
    const auth = extractAuthUser(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Unauthorized: login required' });
    }

    const { action, postId, content, caption, mediaUrls, feeling, location } = req.body || {};

    // Action: Like / Unlike post
    if (action === 'like') {
      if (!postId) {
        return res.status(400).json({ success: false, error: 'postId is required' });
      }

      memoryStore.postLikes = memoryStore.postLikes || [];
      let post = (memoryStore.posts || []).find((p) => p.id === postId);

      if (!post) {
        // Fallback: create resilient placeholder post so the interaction never fails with 404
        post = {
          id: postId,
          userId: auth.userId,
          caption: '',
          mediaUrls: [],
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString(),
        };
        memoryStore.posts.push(post);
        savePostToDb(post).catch(() => {});
      }

      const existingIndex = memoryStore.postLikes.findIndex(
        (l) => l.postId === postId && l.userId === auth.userId
      );

      let isLiked = false;
      if (existingIndex > -1) {
        // Unlike
        memoryStore.postLikes.splice(existingIndex, 1);
        post.likesCount = Math.max(0, (post.likesCount || 1) - 1);
        isLiked = false;
        deletePostLikeFromDb(postId, auth.userId).catch(() => {});
      } else {
        // Like
        memoryStore.postLikes.push({
          id: 'like-' + Date.now(),
          postId,
          userId: auth.userId,
          createdAt: new Date().toISOString(),
        });
        post.likesCount = (post.likesCount || 0) + 1;
        isLiked = true;
        savePostLikeToDb(postId, auth.userId).catch(() => {});

        // Notify post author if not liking own post
        if (post.userId !== auth.userId) {
          const liker = memoryStore.profiles.find((p) => p.userId === auth.userId);
          const likerName = liker?.displayName || 'Someone';
          memoryStore.notifications = memoryStore.notifications || [];
          memoryStore.notifications.push({
            id: 'notif-' + Date.now(),
            userId: post.userId,
            title: '❤️ Post Liked',
            message: `${likerName} liked your post.`,
            type: 'post_like',
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      return res.status(200).json({
        success: true,
        isLiked,
        likesCount: post.likesCount,
      });
    }

    // Action: Add Comment
    if (action === 'comment') {
      if (!postId || !content?.trim()) {
        return res.status(400).json({ success: false, error: 'postId and content are required' });
      }

      let post = (memoryStore.posts || []).find((p) => p.id === postId);
      if (!post) {
        post = {
          id: postId,
          userId: auth.userId,
          caption: '',
          mediaUrls: [],
          likesCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString(),
        };
        memoryStore.posts.push(post);
        savePostToDb(post).catch(() => {});
      }

      const commenter = memoryStore.profiles.find((p) => p.userId === auth.userId);
      const commenterName = commenter?.displayName || 'Member';
      const commenterAvatar = commenter?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

      const newComment = {
        id: 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        postId,
        userId: auth.userId,
        userName: commenterName,
        userAvatar: commenterAvatar,
        content: content.trim().slice(0, 500),
        createdAt: new Date().toISOString(),
      };

      memoryStore.postComments = memoryStore.postComments || [];
      memoryStore.postComments.push(newComment);
      post.commentsCount = (post.commentsCount || 0) + 1;
      savePostCommentToDb(newComment).catch(() => {});

      // Notify post author
      if (post.userId !== auth.userId) {
        memoryStore.notifications = memoryStore.notifications || [];
        memoryStore.notifications.push({
          id: 'notif-' + Date.now(),
          userId: post.userId,
          title: '💬 New Comment',
          message: `${commenterName} commented on your post: "${newComment.content.slice(0, 60)}"`,
          type: 'post_comment',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      return res.status(201).json({
        success: true,
        comment: newComment,
        commentsCount: post.commentsCount,
      });
    }

    // Action: Create New Post (Image or Video)
    if (!caption?.trim() && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({ success: false, error: 'Post requires either a caption or at least one photo/video.' });
    }

    const newPost = {
      id: 'post-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      userId: auth.userId,
      caption: (caption || '').trim().slice(0, 2000),
      mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
      feeling: (feeling || '').trim().slice(0, 50) || null,
      location: (location || '').trim().slice(0, 100) || null,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    memoryStore.posts = memoryStore.posts || [];
    memoryStore.posts.push(newPost);
    savePostToDb(newPost).catch(() => {});

    const authorProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);
    return res.status(201).json({
      success: true,
      post: {
        ...newPost,
        isLiked: false,
        comments: [],
        author: {
          id: auth.userId,
          displayName: authorProfile?.displayName || 'Member',
          avatar: authorProfile?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          verifiedBadge: Boolean(authorProfile?.verifiedBadge),
          city: authorProfile?.city || 'Rwanda',
        },
      },
      message: 'Post shared to community feed successfully!',
    });
  }

  // 3. DELETE: Remove post
  if (req.method === 'DELETE') {
    const auth = extractAuthUser(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const postId = req.query?.id || req.body?.id;
    if (!postId) {
      return res.status(400).json({ success: false, error: 'Post ID is required' });
    }

    const postIndex = (memoryStore.posts || []).findIndex((p) => p.id === postId);
    if (postIndex > -1) {
      const post = memoryStore.posts[postIndex];
      const isAdmin = isAuthorizedRole(auth.role, ['super_admin', 'admin']);
      if (post.userId !== auth.userId && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Cannot delete another user post' });
      }
      memoryStore.posts.splice(postIndex, 1);
    }

    // Always delete from persistent DB & clean memory
    deletePostFromDb(postId).catch(() => {});
    memoryStore.postComments = (memoryStore.postComments || []).filter((c) => c.postId !== postId);
    memoryStore.postLikes = (memoryStore.postLikes || []).filter((l) => l.postId !== postId);

    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
