import { describe, it, expect } from 'vitest';
import { checkMessageModeration } from '../api/_lib/moderation';

describe('Multilingual Contact Leak & Social Media Moderation', () => {
  it('allows normal friendly conversations without contact info', () => {
    expect(checkMessageModeration('Hello! How was your weekend in Kigali?').isViolation).toBe(false);
    expect(checkMessageModeration('Ndagukunda cyane, wari wambwiye ko ukunda ikawa.').isViolation).toBe(false);
    expect(checkMessageModeration('Bonjour, es-tu libre pour discuter de randonnée?').isViolation).toBe(false);
  });

  it('detects plain phone digits', () => {
    const res = checkMessageModeration('Call me at 0788123456 tonight');
    expect(res.isViolation).toBe(true);
    expect(res.violationType).toBe('phone_digits');
  });

  it('detects formatted international phone numbers with spaces and country codes', () => {
    const res = checkMessageModeration('Reach me on +250 788 998 877');
    expect(res.isViolation).toBe(true);
    expect(res.violationType).toBe('phone_digits');
  });

  it('detects obfuscated interspersed numbers', () => {
    const res = checkMessageModeration('My number is 0-7-8-8-1-2-3-4-5-6');
    expect(res.isViolation).toBe(true);
  });

  it('detects spelled-out numbers in English', () => {
    const res = checkMessageModeration('text me zero seven eight eight one two three');
    expect(res.isViolation).toBe(true);
    expect(res.violationType).toBe('phone_words_en');
  });

  it('detects spelled-out numbers in Kinyarwanda', () => {
    const res = checkMessageModeration('Nimero yanjye ni zeru karindwi umunani umunani rimwe');
    expect(res.isViolation).toBe(true);
    expect(res.violationType).toBe('phone_words_rw');
  });

  it('detects spelled-out numbers in French', () => {
    const res = checkMessageModeration('Appelle moi au zero sept huit huit un deux trois');
    expect(res.isViolation).toBe(true);
    expect(res.violationType).toBe('phone_words_fr');
  });

  it('detects external social platforms like WhatsApp and Telegram', () => {
    const res1 = checkMessageModeration('Add me on whatsapp so we can talk');
    expect(res1.isViolation).toBe(true);
    expect(res1.violationType).toBe('social_media');

    const res2 = checkMessageModeration('Check my telegram t.me/kunda_user');
    expect(res2.isViolation).toBe(true);
  });

  it('provides safe suggestions when a violation is caught', () => {
    const res = checkMessageModeration('0788123456');
    expect(res.safeSuggestion).toBeDefined();
    expect(res.safeSuggestion).toContain('Direct Contact Unlock');
  });
});
