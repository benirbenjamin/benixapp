// =====================================================================
// GET /api/members/discover - Algorithmic recommendation endpoint
// =====================================================================
import { extractAuthUser } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';
import { calculateCompatibility, ProfileData } from '../../_lib/matching.js';

export default async function handler(req: any, res: any) {
  const auth = extractAuthUser(req);
  if (!auth) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Lookup current user and profile
  const currentUser = memoryStore.users.find((u) => u.id === auth.userId);
  const currentProfile = memoryStore.profiles.find((p) => p.userId === auth.userId);

  if (!currentProfile) {
    return res.status(404).json({ success: false, error: 'User profile not found. Please complete profile registration.' });
  }

  const userModel: ProfileData = {
    id: currentProfile.id,
    userId: auth.userId,
    displayName: currentProfile.displayName,
    gender: currentProfile.gender,
    interestedIn: currentProfile.interestedIn,
    country: currentProfile.country,
    city: currentProfile.city,
    dob: currentUser?.dob || '1995-01-01',
    relationshipIntention: currentProfile.relationshipIntention,
    languages: currentProfile.languages,
    interests: currentProfile.interests,
    minAgePref: currentProfile.minAgePref,
    maxAgePref: currentProfile.maxAgePref,
    datingScope: currentProfile.datingScope,
  };

  // Get list of IDs already liked or passed
  const passedIds = new Set(memoryStore.passes.filter((p) => p.fromUserId === auth.userId).map((p) => p.toUserId));
  const candidateProfiles = memoryStore.profiles.filter(
    (p) => p.userId !== auth.userId && !passedIds.has(p.userId)
  );

  const queryParams = req.query || {};
  const filterCity = queryParams.city;
  const filterIntention = queryParams.intention;

  const results = [];

  for (const cand of candidateProfiles) {
    const candUser = memoryStore.users.find((u) => u.id === cand.userId);
    if (!candUser || candUser.isSuspended) continue;

    if (filterCity && cand.city.toLowerCase() !== filterCity.toLowerCase()) continue;
    if (filterIntention && cand.relationshipIntention !== filterIntention) continue;

    const candModel: ProfileData = {
      id: cand.id,
      userId: cand.userId,
      displayName: cand.displayName,
      gender: cand.gender,
      interestedIn: cand.interestedIn,
      country: cand.country,
      city: cand.city,
      dob: candUser.dob,
      relationshipIntention: cand.relationshipIntention,
      languages: cand.languages,
      interests: cand.interests,
    };

    const compatibility = calculateCompatibility(userModel, candModel);

    // Hard filter: only include if gender compatibility holds
    if (compatibility.isHardMatch) {
      // Check if unlocked contact
      const isContactUnlocked = memoryStore.contactUnlocks.some(
        (cu) => cu.requesterId === auth.userId && cu.targetUserId === cand.userId
      );

      // Check if already liked
      const isLiked = memoryStore.likes.some(
        (l) => l.fromUserId === auth.userId && l.toUserId === cand.userId
      );

      results.push({
        id: cand.id,
        userId: cand.userId,
        displayName: cand.displayName,
        gender: cand.gender,
        country: cand.country,
        city: cand.city,
        bio: cand.bio,
        height: cand.height,
        languages: cand.languages || [],
        occupation: cand.occupation,
        education: cand.education,
        relationshipIntention: cand.relationshipIntention,
        interests: cand.interests || [],
        photos: cand.photos || [],
        verifiedBadge: cand.verifiedBadge || false,
        compatibilityScore: compatibility.score,
        compatibilityBreakdown: compatibility.breakdown,
        sharedInterests: compatibility.sharedInterests,
        sharedLanguages: compatibility.sharedLanguages,
        matchReasons: compatibility.reasons,
        isLiked,
        isContactUnlocked,
        // DO NOT reveal phone number here!
      });
    }
  }

  // Sort by compatibility score descending
  results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return res.status(200).json({
    success: true,
    total: results.length,
    profiles: results,
  });
}
