// =====================================================================
// POST /api/members/interaction - Like, Pass, Superlike & Mutual Matching
// =====================================================================
import crypto from 'crypto';
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';
import { calculateCompatibility } from '../../_lib/matching.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { targetUserId, action } = req.body;
  if (!targetUserId || !['like', 'pass', 'super_like'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Target user ID and valid action (like, pass, super_like) required.' });
  }

  if (targetUserId === auth.userId) {
    return res.status(400).json({ success: false, error: 'Cannot interact with your own profile.' });
  }

  if (action === 'pass') {
    memoryStore.passes.push({
      id: crypto.randomUUID(),
      fromUserId: auth.userId,
      toUserId: targetUserId,
      createdAt: new Date().toISOString(),
    });
    return res.status(200).json({ success: true, isMatch: false });
  }

  // Handle 'like' or 'super_like'
  const isSuperLike = action === 'super_like';
  const existingLike = memoryStore.likes.find(
    (l) => l.fromUserId === auth.userId && l.toUserId === targetUserId
  );

  if (!existingLike) {
    memoryStore.likes.push({
      id: crypto.randomUUID(),
      fromUserId: auth.userId,
      toUserId: targetUserId,
      isSuperLike,
      createdAt: new Date().toISOString(),
    });

    // Notify target user of new like
    const senderProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);
    memoryStore.notifications.unshift({
      id: crypto.randomUUID(),
      userId: targetUserId,
      type: isSuperLike ? 'super_like' : 'new_like',
      title: isSuperLike ? 'Star Connection!' : 'Someone Liked You!',
      body: `${senderProfile?.displayName || 'A member'} ${isSuperLike ? 'sent you a Super Like' : 'liked your profile'}.`,
      linkUrl: '/dashboard/matches',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Check if mutual like exists!
  const targetUserLikedMe = memoryStore.likes.some(
    (l) => l.fromUserId === targetUserId && l.toUserId === auth.userId
  );

  if (targetUserLikedMe) {
    // Check if match is already created
    const existingMatch = memoryStore.matches.find(
      (m) =>
        (m.user1Id === auth.userId && m.user2Id === targetUserId) ||
        (m.user1Id === targetUserId && m.user2Id === auth.userId)
    );

    let matchId = existingMatch?.id;
    if (!existingMatch) {
      matchId = crypto.randomUUID();

      const userP = memoryStore.profiles.find((p) => p.userId === auth.userId);
      const userU = memoryStore.users.find((u) => u.id === auth.userId);
      const targetP = memoryStore.profiles.find((p) => p.userId === targetUserId);
      const targetU = memoryStore.users.find((u) => u.id === targetUserId);

      let realScore = 85;
      if (userP && targetP) {
        const comp = calculateCompatibility(
          {
            id: userP.id,
            userId: auth.userId,
            displayName: userP.displayName,
            gender: userP.gender,
            interestedIn: userP.interestedIn,
            country: userP.country,
            city: userP.city,
            dob: userU?.dob || '1995-01-01',
            relationshipIntention: userP.relationshipIntention,
            languages: userP.languages,
            interests: userP.interests,
          },
          {
            id: targetP.id,
            userId: targetUserId,
            displayName: targetP.displayName,
            gender: targetP.gender,
            interestedIn: targetP.interestedIn,
            country: targetP.country,
            city: targetP.city,
            dob: targetU?.dob || '1995-01-01',
            relationshipIntention: targetP.relationshipIntention,
            languages: targetP.languages,
            interests: targetP.interests,
          }
        );
        realScore = comp.score;
      }

      memoryStore.matches.unshift({
        id: matchId,
        user1Id: auth.userId,
        user2Id: targetUserId,
        compatibilityScore: realScore,
        createdAt: new Date().toISOString(),
      });

      // Also create or ensure a conversation exists
      const convId = crypto.randomUUID();
      memoryStore.conversations.push({
        id: convId,
        participant1Id: auth.userId,
        participant2Id: targetUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Send notifications to both
      const targetProfile = memoryStore.profiles.find((p) => p.userId === targetUserId);
      const senderProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);

      memoryStore.notifications.unshift({
        id: crypto.randomUUID(),
        userId: auth.userId,
        type: 'mutual_match',
        title: "It's a Match! 🎉",
        body: `You and ${targetProfile?.displayName || 'a member'} both liked each other! Start a conversation now.`,
        linkUrl: `/dashboard/messages?user=${targetUserId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      memoryStore.notifications.unshift({
        id: crypto.randomUUID(),
        userId: targetUserId,
        type: 'mutual_match',
        title: "It's a Match! 🎉",
        body: `You and ${senderProfile?.displayName || 'a member'} both liked each other!`,
        linkUrl: `/dashboard/messages?user=${auth.userId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        isMatch: true,
        matchId,
        matchedUser: targetProfile,
      });
    }

    const targetProfile = memoryStore.profiles.find((p) => p.userId === targetUserId);
    return res.status(200).json({
      success: true,
      isMatch: true,
      matchId,
      matchedUser: targetProfile,
    });
  }

  return res.status(200).json({ success: true, isMatch: false });
}
