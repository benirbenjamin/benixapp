// =====================================================================
// GET /api/members/matches - List mutual matches with real compatibility
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore, query } from '../../_lib/db.js';
import { calculateCompatibility, ProfileData } from '../../_lib/matching.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  let currentUser = memoryStore.users.find((u) => u.id === auth.userId);
  let currentProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);

  if (!currentUser) {
    const uRes = await query('SELECT * FROM users WHERE id = $1', [auth.userId]);
    if (uRes?.rows?.[0]) currentUser = uRes.rows[0];
  }
  if (!currentProfile) {
    const pRes = await query('SELECT * FROM profiles WHERE user_id = $1', [auth.userId]);
    if (pRes?.rows?.[0]) currentProfile = pRes.rows[0];
  }

  const userMatches = memoryStore.matches.filter(
    (m) => m.user1Id === auth.userId || m.user2Id === auth.userId
  );

  const results = [];
  for (const m of userMatches) {
    const partnerId = m.user1Id === auth.userId ? m.user2Id : m.user1Id;
    let partnerProfile = memoryStore.profiles.find((p) => p.userId === partnerId);
    let partnerUser = memoryStore.users.find((u) => u.id === partnerId);

    if (!partnerProfile) {
      const pRes = await query('SELECT * FROM profiles WHERE user_id = $1', [partnerId]);
      if (pRes?.rows?.[0]) partnerProfile = pRes.rows[0];
    }
    if (!partnerUser) {
      const uRes = await query('SELECT * FROM users WHERE id = $1', [partnerId]);
      if (uRes?.rows?.[0]) partnerUser = uRes.rows[0];
    }

    if (partnerProfile) {
      let score = m.compatibilityScore;
      let reasons: string[] = [];
      let sharedInterests: string[] = [];

      if (currentProfile && partnerProfile) {
        const userModel: ProfileData = {
          id: currentProfile.id || currentProfile.userId || auth.userId,
          userId: auth.userId,
          displayName: currentProfile.displayName || currentProfile.display_name || 'Member',
          gender: currentProfile.gender || 'other',
          interestedIn: currentProfile.interestedIn || currentProfile.interested_in || 'everyone',
          country: currentProfile.country || 'Rwanda',
          city: currentProfile.city || 'Kigali',
          dob: currentUser?.dob || '1995-01-01',
          relationshipIntention: currentProfile.relationshipIntention || currentProfile.relationship_intention || 'serious_relationship',
          languages: currentProfile.languages,
          interests: currentProfile.interests,
        };

        const partnerModel: ProfileData = {
          id: partnerProfile.id || partnerProfile.userId || partnerId,
          userId: partnerId,
          displayName: partnerProfile.displayName || partnerProfile.display_name || 'Member',
          gender: partnerProfile.gender || 'other',
          interestedIn: partnerProfile.interestedIn || partnerProfile.interested_in || 'everyone',
          country: partnerProfile.country || 'Rwanda',
          city: partnerProfile.city || 'Kigali',
          dob: partnerUser?.dob || '1995-01-01',
          relationshipIntention: partnerProfile.relationshipIntention || partnerProfile.relationship_intention || 'serious_relationship',
          languages: partnerProfile.languages,
          interests: partnerProfile.interests,
        };

        const comp = calculateCompatibility(userModel, partnerModel);
        score = comp.score;
        reasons = comp.reasons;
        sharedInterests = comp.sharedInterests;
      }

      results.push({
        matchId: m.id,
        partnerId,
        displayName: partnerProfile.displayName || partnerProfile.display_name || 'Member',
        city: partnerProfile.city || 'Rwanda',
        country: partnerProfile.country || 'Rwanda',
        relationshipIntention: partnerProfile.relationshipIntention || partnerProfile.relationship_intention || 'serious_relationship',
        photos: partnerProfile.photos || [],
        compatibilityScore: score,
        matchReasons: reasons,
        sharedInterests,
        createdAt: m.createdAt,
      });
    }
  }

  return res.status(200).json({ success: true, matches: results });
}
