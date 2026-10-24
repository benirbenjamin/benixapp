/**
 * BenixSpace Personalized Video Feed Recommendation Engine
 * Dynamically adapts the user's feed according to:
 * 1. Interaction History (videos watched, liked, categories loved)
 * 2. Search History (recent search terms matched to titles & descriptions)
 * 3. Freshness / Recency Boost (newest uploaded videos prioritized)
 * 4. Repetition Penalty (prevents users from seeing the same videos repeatedly)
 * 5. Novelty & Exploration Jitter (adds discovery of new channels)
 */

export interface InteractionProfile {
  categoryScores: Record<string, number>;
  creatorScores: Record<string, number>;
  recentSearches: string[];
  watchHistory: Record<string, { count: number; lastWatched: number }>;
}

const STORAGE_KEY_PREFIX = 'benix_recom_profile_';

export function getInteractionProfile(userId?: string): InteractionProfile {
  try {
    const key = STORAGE_KEY_PREFIX + (userId || 'guest');
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    categoryScores: {},
    creatorScores: {},
    recentSearches: [],
    watchHistory: {}
  };
}

export function saveInteractionProfile(profile: InteractionProfile, userId?: string) {
  try {
    const key = STORAGE_KEY_PREFIX + (userId || 'guest');
    localStorage.setItem(key, JSON.stringify(profile));
  } catch {}
}

/**
 * Record a user watch interaction
 */
export function recordWatchInteraction(
  video: { id: string; category?: string; creator?: string; channelName?: string; title?: string },
  userId?: string
) {
  const profile = getInteractionProfile(userId);

  // Increment category affinity
  const cat = video.category || 'General';
  profile.categoryScores[cat] = (profile.categoryScores[cat] || 0) + 1;

  // Increment creator affinity
  const creator = video.channelName || video.creator || '';
  if (creator) {
    profile.creatorScores[creator] = (profile.creatorScores[creator] || 0) + 1;
  }

  // Update watch history & timestamp
  const now = Date.now();
  const past = profile.watchHistory[video.id] || { count: 0, lastWatched: 0 };
  profile.watchHistory[video.id] = {
    count: past.count + 1,
    lastWatched: now
  };

  saveInteractionProfile(profile, userId);

  // Sync with backend non-blockingly
  fetch('/api/modules/videos/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoId: video.id,
      category: cat,
      channelName: creator,
      interactionType: 'watch'
    })
  }).catch(() => {});
}

/**
 * Record a user search query
 */
export function recordSearchInteraction(query: string, userId?: string) {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return;

  const profile = getInteractionProfile(userId);
  profile.recentSearches = [clean, ...profile.recentSearches.filter((s) => s !== clean)].slice(0, 10);
  saveInteractionProfile(profile, userId);

  fetch('/api/modules/videos/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interactionType: 'search',
      query: clean
    })
  }).catch(() => {});
}

/**
 * Record a video like
 */
export function recordLikeInteraction(
  video: { id: string; category?: string; creator?: string; channelName?: string },
  userId?: string
) {
  const profile = getInteractionProfile(userId);
  const cat = video.category || 'General';
  profile.categoryScores[cat] = (profile.categoryScores[cat] || 0) + 3;

  const creator = video.channelName || video.creator || '';
  if (creator) {
    profile.creatorScores[creator] = (profile.creatorScores[creator] || 0) + 3;
  }
  saveInteractionProfile(profile, userId);

  fetch('/api/modules/videos/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      videoId: video.id,
      category: cat,
      channelName: creator,
      interactionType: 'like'
    })
  }).catch(() => {});
}

/**
 * Rank and personalize videos using the Recommendation Algorithm
 */
export function rankPersonalizedVideos<T extends {
  id: string;
  title: string;
  category?: string;
  creator?: string;
  channelName?: string;
  description?: string;
  createdAt?: string;
  views?: number;
}>(videos: T[], userId?: string): T[] {
  if (!videos || videos.length <= 1) return videos;

  const profile = getInteractionProfile(userId);
  const now = Date.now();
  const searchTerms = profile.recentSearches.map((s) => s.toLowerCase());

  // Score each video
  const scored = videos.map((video) => {
    let score = 0;

    // 1. FRESHNESS BOOST (Newest videos are recommended mostly)
    if (video.createdAt) {
      const createdTime = new Date(video.createdAt).getTime();
      const ageHours = (now - createdTime) / (1000 * 3600);
      if (ageHours <= 24) {
        score += 55; // Uploaded in last 24 hours
      } else if (ageHours <= 72) {
        score += 40; // Uploaded in last 3 days
      } else if (ageHours <= 168) {
        score += 25; // Uploaded in last 7 days
      } else if (ageHours <= 720) {
        score += 15; // Uploaded in last 30 days
      }
    } else {
      // Base score for videos without explicit createdAt
      score += 10;
    }

    // 2. CATEGORY AFFINITY (What the user loves to watch)
    const cat = video.category || 'General';
    const catAffinity = profile.categoryScores[cat] || 0;
    score += Math.min(45, catAffinity * 8);

    // 3. CREATOR AFFINITY (Channels the user watches mostly)
    const creator = video.channelName || video.creator || '';
    if (creator) {
      const creatorAffinity = profile.creatorScores[creator] || 0;
      score += Math.min(50, creatorAffinity * 10);
    }

    // 4. SEARCH RELEVANCE
    if (searchTerms.length > 0) {
      const titleLower = video.title.toLowerCase();
      const descLower = (video.description || '').toLowerCase();
      for (const term of searchTerms) {
        if (titleLower.includes(term) || descLower.includes(term)) {
          score += 30;
          break;
        }
      }
    }

    // 5. REPETITION PENALTY (Prevents showing the same videos repeatedly)
    const history = profile.watchHistory[video.id];
    if (history) {
      const hoursSinceWatch = (now - history.lastWatched) / (1000 * 3600);
      if (hoursSinceWatch < 3) {
        score -= 50; // Just watched in the last 3 hours, downrank to show new content
      } else if (hoursSinceWatch < 24) {
        score -= 30; // Watched today
      } else if (history.count >= 3) {
        score -= 20; // Watched multiple times
      }
    }

    // 6. NOVELTY / EXPLORATION JITTER (Ensures diverse feed across visits)
    // Deterministic pseudo-randomness based on ID characters plus small live jitter
    const idHash = video.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 15;
    score += idHash * 0.5;

    return { video, score };
  });

  // Sort descending by calculated score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.video);
}
