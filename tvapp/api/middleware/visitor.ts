import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool.js';

export interface VisitorRequest extends Request {
  visitorId: string;
  sessionId: string;
  deviceType: string;
  browser: string;
  os: string;
  country: string;
}

export function parseUserAgent(ua: string = '') {
  let deviceType = 'Desktop';
  if (/mobile/i.test(ua)) deviceType = 'Mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'Tablet';

  let browser = 'Other';
  if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';

  let os = 'Other';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { deviceType, browser, os };
}

export function visitorMiddleware(req: Request, res: Response, next: NextFunction): void {
  const vReq = req as VisitorRequest;

  // Header or body identifier provided by client analytics script
  const visitorId = (req.headers['x-visitor-id'] as string) || req.body?.visitor_id || uuidv4();
  const sessionId = (req.headers['x-session-id'] as string) || req.body?.session_id || uuidv4();

  const ua = req.headers['user-agent'] || '';
  const parsed = parseUserAgent(ua);

  // Vercel / Cloudflare headers
  const country =
    (req.headers['x-vercel-ip-country'] as string) ||
    (req.headers['cf-ipcountry'] as string) ||
    'Rwanda';

  vReq.visitorId = visitorId;
  vReq.sessionId = sessionId;
  vReq.deviceType = parsed.deviceType;
  vReq.browser = parsed.browser;
  vReq.os = parsed.os;
  vReq.country = country;

  next();
}
