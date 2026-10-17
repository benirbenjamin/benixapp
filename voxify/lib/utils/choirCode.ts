/**
 * Generates a clean, unambiguous 5-character alphanumeric choir code
 * Excludes easily confused characters like O, 0, I, 1, L
 */
export function generateChoirCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isValidChoirCode(code: string): boolean {
  return /^[A-Z0-9]{5}$/i.test(code.trim());
}
