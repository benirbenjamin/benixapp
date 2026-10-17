import { describe, it, expect } from 'vitest';
import { calculateAge, isAdult } from '../api/_lib/auth';

describe('Server-Side Adult Age Verification (18+)', () => {
  it('correctly calculates age for adult born 25 years ago', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate())
      .toISOString()
      .split('T')[0];
    expect(calculateAge(dob)).toBe(25);
    expect(isAdult(dob)).toBe(true);
  });

  it('rejects minor born 17 years ago', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate())
      .toISOString()
      .split('T')[0];
    expect(calculateAge(dob)).toBe(17);
    expect(isAdult(dob)).toBe(false);
  });

  it('rejects minor born 17 years and 360 days ago', () => {
    const today = new Date();
    const dobDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 5);
    const dob = dobDate.toISOString().split('T')[0];
    expect(isAdult(dob)).toBe(false);
  });

  it('accepts person who turned exactly 18 today', () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
      .toISOString()
      .split('T')[0];
    expect(calculateAge(dob)).toBe(18);
    expect(isAdult(dob)).toBe(true);
  });

  it('safely handles invalid or empty DOB strings', () => {
    expect(calculateAge('')).toBe(0);
    expect(isAdult('')).toBe(false);
    expect(calculateAge('invalid-date')).toBe(0);
    expect(isAdult('invalid-date')).toBe(false);
  });
});
