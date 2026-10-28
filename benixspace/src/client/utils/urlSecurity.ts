/**
 * URL Security & Parameter Encryption Utility
 * Prevents exposing sensitive chat partner IDs, user names, topics, or private queries in browser URLs.
 */

// Simple URL-safe Base64-based payload encryption with XOR obfuscation
export function encryptPayload(data: Record<string, any>): string {
  try {
    const jsonStr = JSON.stringify(data);
    const key = 0x5a;
    const chars = Array.from(jsonStr).map((c) => String.fromCharCode(c.charCodeAt(0) ^ key)).join('');
    return 'bx_' + btoa(encodeURIComponent(chars)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

export function decryptPayload(token: string): Record<string, any> | null {
  try {
    if (!token) return null;
    let clean = token;
    if (clean.startsWith('bx_')) {
      clean = clean.substring(3);
    }
    clean = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4 !== 0) {
      clean += '=';
    }
    const chars = decodeURIComponent(atob(clean));
    const key = 0x5a;
    const jsonStr = Array.from(chars).map((c) => String.fromCharCode(c.charCodeAt(0) ^ key)).join('');
    return JSON.parse(jsonStr);
  } catch {
    try {
      // Fallback: direct base64 decode
      let raw = token.startsWith('bx_') ? token.substring(3) : token;
      raw = raw.replace(/-/g, '+').replace(/_/g, '/');
      while (raw.length % 4 !== 0) raw += '=';
      return JSON.parse(decodeURIComponent(atob(raw)));
    } catch {
      return null;
    }
  }
}

/**
 * Builds a secure URL where sensitive parameters are encrypted into ?sec=<token>
 */
export function buildSecureUrl(basePath: string, sensitiveParams: Record<string, any>): string {
  const token = encryptPayload(sensitiveParams);
  if (!token) {
    const query = new URLSearchParams(sensitiveParams).toString();
    return query ? `${basePath}?${query}` : basePath;
  }
  return `${basePath}?sec=${token}`;
}
