import app from '../src/server/index';

export default function handler(req: any, res: any) {
  try {
    const matched =
      req.headers['x-matched-path'] ||
      req.headers['x-vercel-matched-path'] ||
      req.headers['x-forwarded-uri'] ||
      req.headers['x-original-url'];

    if (matched && typeof matched === 'string' && matched.startsWith('/api')) {
      req.url = matched;
    }

    return app(req, res);
  } catch (err: any) {
    console.error('🔴 [VERCEL_HANDLER_ERROR]:', err);
    if (!res.headersSent) {
      return res.status(500).json({
        error: err.message || 'Serverless handler failed',
        details: String(err)
      });
    }
  }
}
