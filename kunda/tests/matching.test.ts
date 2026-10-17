import { describe, it, expect } from 'vitest';
import { calculateCompatibility, checkHardEligibility, ProfileData } from '../api/_lib/matching';

describe('Algorithmic Matching Engine & Compatibility Scoring', () => {
  const userA: ProfileData = {
    id: 'p-1',
    userId: 'u-1',
    displayName: 'Keza',
    gender: 'woman',
    interestedIn: 'men',
    country: 'Rwanda',
    city: 'Kigali',
    dob: '1998-05-10',
    relationshipIntention: 'serious_relationship',
    languages: ['English', 'Kinyarwanda'],
    interests: ['Coffee & Tea Tasting', 'Hiking in 1000 Hills', 'Tech & Entrepreneurship'],
    minAgePref: 25,
    maxAgePref: 35,
    datingScope: 'local',
  };

  const userB: ProfileData = {
    id: 'p-2',
    userId: 'u-2',
    displayName: 'Eric',
    gender: 'man',
    interestedIn: 'women',
    country: 'Rwanda',
    city: 'Kigali',
    dob: '1995-08-20',
    relationshipIntention: 'serious_relationship',
    languages: ['English', 'Kinyarwanda', 'French'],
    interests: ['Hiking in 1000 Hills', 'Coffee & Tea Tasting', 'Fitness & Gym'],
    minAgePref: 22,
    maxAgePref: 30,
    datingScope: 'local',
  };

  const userC_IncompatibleGender: ProfileData = {
    id: 'p-3',
    userId: 'u-3',
    displayName: 'Paul',
    gender: 'man',
    interestedIn: 'men', // User A is a woman, so hard eligibility must fail
    country: 'Rwanda',
    city: 'Kigali',
    dob: '1996-01-01',
    relationshipIntention: 'serious_relationship',
  };

  it('verifies mutual hard gender eligibility', () => {
    expect(checkHardEligibility(userA, userB)).toBe(true);
    expect(checkHardEligibility(userA, userC_IncompatibleGender)).toBe(false);
  });

  it('calculates score strictly between 0 and 100', () => {
    const result = calculateCompatibility(userA, userB);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThan(70); // High alignment due to goals, location, interests
  });

  it('identifies shared interests and shared languages', () => {
    const result = calculateCompatibility(userA, userB);
    expect(result.sharedInterests).toContain('Hiking in 1000 Hills');
    expect(result.sharedInterests).toContain('Coffee & Tea Tasting');
    expect(result.sharedLanguages).toContain('English');
    expect(result.sharedLanguages).toContain('Kinyarwanda');
  });

  it('generates clear readable match explanations', () => {
    const result = calculateCompatibility(userA, userB);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.reasons.some((r) => r.includes('Both seeking serious relationship'))).toBe(true);
    expect(result.reasons.some((r) => r.includes('Kigali'))).toBe(true);
  });
});
