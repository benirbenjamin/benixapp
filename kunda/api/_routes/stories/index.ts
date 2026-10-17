// =====================================================================
// GET & POST /api/stories - Ephemeral 24h Stories with 45s Video Limit
// =====================================================================
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import {
  memoryStore,
  loadFeedAndStoriesFromDb,
  saveStoryToDb,
  deleteStoryFromDb,
  recordStoryViewInDb,
} from '../../_lib/db.js';

export default async function handler(req: any, res: any) {
  // Always load unexpired stories from persistent DB
  await loadFeedAndStoriesFromDb().catch(() => {});

  // 1. GET: Return all unexpired stories grouped by user
  if (req.method === 'GET') {
    const auth = extractAuthUser(req);
    const now = new Date().getTime();

    // Filter out stories older than 24 hours
    const activeStories = (memoryStore.stories || []).filter((s) => {
      const exp = s.expiresAt ? new Date(s.expiresAt).getTime() : 0;
      return exp > now;
    });

    // Group stories by userId
    const groupedMap = new Map<string, any>();

    for (const story of activeStories) {
      if (!groupedMap.has(story.userId)) {
        const user = memoryStore.users.find((u) => u.id === story.userId);
        const profile = memoryStore.profiles.find((p) => p.userId === story.userId);
        const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Kunda Member';
        const avatar = profile?.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
        const verified = Boolean(profile?.verifiedBadge);

        groupedMap.set(story.userId, {
          userId: story.userId,
          displayName,
          avatar,
          verifiedBadge: verified,
          isOwn: auth?.userId === story.userId,
          stories: [],
        });
      }

      const group = groupedMap.get(story.userId);
      group.stories.push({
        ...story,
        viewsCount: story.viewsCount || 0,
        isLiked: Boolean(story.likedBy?.includes(auth?.userId)),
      });
    }

    // Sort stories inside each group chronologically
    const grouped = Array.from(groupedMap.values()).map((g) => {
      g.stories.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return g;
    });

    // Bring current user's group to front if exists
    if (auth?.userId) {
      grouped.sort((a, b) => (a.userId === auth.userId ? -1 : b.userId === auth.userId ? 1 : 0));
    }

    return res.status(200).json({
      success: true,
      storiesGrouped: grouped,
      totalActiveStories: activeStories.length,
    });
  }

  // 2. POST: Create story, like story, or record story view
  if (req.method === 'POST') {
    const auth = extractAuthUser(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Unauthorized: login required to interact with stories' });
    }

    const { action, storyId, mediaUrl, mediaType, caption, duration, segmentIndex, totalSegments } = req.body || {};

    // View action: Record story view
    if (action === 'view') {
      if (!storyId) {
        return res.status(400).json({ success: false, error: 'storyId is required' });
      }
      const viewsCount = await recordStoryViewInDb(storyId, auth.userId);
      return res.status(200).json({ success: true, viewsCount });
    }

    // Like / React action
    if (action === 'like') {
      if (!storyId) {
        return res.status(400).json({ success: false, error: 'storyId is required' });
      }
      let story = (memoryStore.stories || []).find((s) => s.id === storyId);
      if (!story) {
        return res.status(200).json({ success: true, isLiked: true, likesCount: 1 });
      }
      story.likedBy = story.likedBy || [];
      const hasLiked = story.likedBy.includes(auth.userId);
      if (hasLiked) {
        story.likedBy = story.likedBy.filter((id: string) => id !== auth.userId);
        story.likesCount = Math.max(0, (story.likesCount || 1) - 1);
      } else {
        story.likedBy.push(auth.userId);
        story.likesCount = (story.likesCount || 0) + 1;

        // Send notification to story author
        if (story.userId !== auth.userId) {
          const senderProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);
          const senderName = senderProfile?.displayName || 'A member';
          memoryStore.notifications.push({
            id: 'notif-' + Date.now(),
            userId: story.userId,
            title: '❤️ Story Reaction',
            message: `${senderName} loved your story!`,
            type: 'story_like',
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
      saveStoryToDb(story).catch(() => {});
      return res.status(200).json({ success: true, isLiked: !hasLiked, likesCount: story.likesCount });
    }

    // Story Creation
    if (!mediaUrl) {
      return res.status(400).json({ success: false, error: 'mediaUrl is required for stories' });
    }

    const mType = mediaType === 'video' ? 'video' : 'image';
    let dur = typeof duration === 'number' ? duration : mType === 'video' ? 15 : 5;

    // Strict validation: Video cannot exceed 45 seconds (with 0.5s tolerance)
    if (mType === 'video' && dur > 45.5) {
      return res.status(400).json({
        success: false,
        error: 'Video exceeds the 45-second limit. Please use the clip trimmer to split into 45-second segments.',
      });
    }

    if (dur > 45) {
      dur = 45;
    }

    const now = Date.now();
    const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();

    const newStory = {
      id: 'story-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      userId: auth.userId,
      mediaUrl,
      mediaType: mType,
      duration: dur,
      caption: (caption || '').trim().slice(0, 300),
      segmentIndex: typeof segmentIndex === 'number' ? segmentIndex : 1,
      totalSegments: typeof totalSegments === 'number' ? totalSegments : 1,
      likesCount: 0,
      likedBy: [],
      viewsCount: 0,
      createdAt: new Date(now).toISOString(),
      expiresAt,
    };

    memoryStore.stories = memoryStore.stories || [];
    memoryStore.stories.push(newStory);
    saveStoryToDb(newStory).catch(() => {});

    return res.status(201).json({
      success: true,
      story: newStory,
      message: 'Story published successfully! It will be visible for 24 hours.',
    });
  }

  // 3. DELETE: Remove own story
  if (req.method === 'DELETE') {
    const auth = extractAuthUser(req);
    if (!auth) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const storyId = req.query?.id || req.body?.id;
    if (!storyId) {
      return res.status(400).json({ success: false, error: 'Story ID is required' });
    }

    const index = (memoryStore.stories || []).findIndex((s) => s.id === storyId);
    if (index > -1) {
      const story = memoryStore.stories[index];
      const isAdmin = isAuthorizedRole(auth.role, ['super_admin', 'admin']);
      if (story.userId !== auth.userId && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Cannot delete another user story' });
      }
      memoryStore.stories.splice(index, 1);
    }

    deleteStoryFromDb(storyId).catch(() => {});
    return res.status(200).json({ success: true, message: 'Story deleted successfully' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
