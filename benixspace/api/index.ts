import app from '../src/server/index';

export default function handler(req: any, res: any) {
  // Normalize request URL so Express routes match properly in Vercel serverless environment
  const matched =
    req.headers['x-matched-path'] ||
    req.headers['x-vercel-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-original-url'];

  if (matched && typeof matched === 'string' && matched.startsWith('/api')) {
    req.url = matched;
  }

  return app(req, res);
}
