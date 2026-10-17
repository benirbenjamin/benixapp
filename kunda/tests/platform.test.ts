import { describe, it, expect } from 'vitest';
import { isAdult } from '../api/_lib/auth';
import { moderateMessageContent } from '../api/_lib/moderation';
import { calculateCompatibility } from '../api/_lib/matching';
import { getEmailConfig } from '../api/_lib/email';
import { getDriveConfig } from '../api/_lib/drive';

describe('1. Adult Eligibility (18+ Verification)', () => {
  it('strictly approves adults aged 18 and older', () => {
    const today = new Date();
    const adultDob = new Date(today.getFullYear() - 22, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    expect(isAdult(adultDob)).toBe(true);
  });

  it('strictly rejects minors under 18 years old', () => {
    const today = new Date();
    const minorDob = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    expect(isAdult(minorDob)).toBe(false);
  });

  it('rejects invalid or future birth dates', () => {
    expect(isAdult('2099-01-01')).toBe(false);
    expect(isAdult('invalid-date')).toBe(false);
  });
});

describe('2. Multilingual Contact Leak & Anti-Scam Moderation', () => {
  it('allows safe romantic conversation in English, French, and Kinyarwanda', () => {
    const safeText = 'Muraho neza! Amakuru ki? Nshimishijwe no kukubona kuri Kunda Space.';
    const res = moderateMessageContent(safeText);
    expect(res.isClean).toBe(true);
    expect(res.violatesContactPolicy).toBe(false);
  });

  it('catches phone digits (Rwandan and international formats)', () => {
    const flagged1 = 'Hit me up at 0788123456 tomorrow';
    const flagged2 = 'Call me: +250 788 456 789';
    expect(moderateMessageContent(flagged1).violatesContactPolicy).toBe(true);
    expect(moderateMessageContent(flagged2).violatesContactPolicy).toBe(true);
  });

  it('catches obfuscated spelled-out numbers in Kinyarwanda', () => {
    const obfuscated = 'Nimero yanjye ni zero karindwi umunani umunani rimwe';
    expect(moderateMessageContent(obfuscated).violatesContactPolicy).toBe(true);
  });

  it('catches social handles (WhatsApp, Instagram, Telegram)', () => {
    expect(moderateMessageContent('DM me on whatsapp please').violatesContactPolicy).toBe(true);
    expect(moderateMessageContent('Find me on ig: @amour_kigali').violatesContactPolicy).toBe(true);
    expect(moderateMessageContent('My telegram handle is @kunda_rw').violatesContactPolicy).toBe(true);
  });
});

describe('3. Matching Compatibility Engine', () => {
  it('calculates higher compatibility for aligned relationship intentions and shared interests', () => {
    const userA = {
      relationshipIntention: 'marriage',
      interests: ['Traditional Dance', 'Coffee Tasting', 'Hiking', 'Entrepreneurship'],
      languages: ['English', 'Kinyarwanda'],
      minAgePref: 22,
      maxAgePref: 32,
      country: 'Rwanda',
      city: 'Kigali',
    };

    const userB = {
      relationshipIntention: 'marriage',
      interests: ['Traditional Dance', 'Coffee Tasting', 'Art & Culture'],
      languages: ['English', 'Kinyarwanda', 'French'],
      dob: '1998-05-12',
      country: 'Rwanda',
      city: 'Kigali',
    };

    const result = calculateCompatibility(userA as any, userB as any);
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

describe('4. Settings Integration (Email & Google Drive)', () => {
  it('returns structured email configuration defaults', () => {
    const emailConfig = getEmailConfig();
    expect(emailConfig).toHaveProperty('provider');
    expect(emailConfig).toHaveProperty('resendApiKey');
    expect(emailConfig).toHaveProperty('smtpHost');
  });

  it('returns Google Drive configuration structure', () => {
    const driveConfig = getDriveConfig();
    expect(driveConfig).toHaveProperty('clientId');
    expect(driveConfig).toHaveProperty('clientSecret');
    expect(driveConfig).toHaveProperty('refreshToken');
  });
});
