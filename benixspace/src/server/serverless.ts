import app from './index';

export default function handler(req: any, res: any) {
  return new Promise((resolve) => {
    // Keep serverless function alive until response is finished
    res.on('finish', () => resolve(null));
    res.on('close', () => resolve(null));

    try {
      // Reconstruct original request path from query parameter __path (from vercel.json rewrite)
      if (req.query && req.query.__path) {
        const subPath = String(req.query.__path);
        delete req.query.__path;

        const queryParams = new URLSearchParams();
        for (const [k, v] of Object.entries(req.query)) {
          if (Array.isArray(v)) {
            v.forEach((val) => queryParams.append(k, String(val)));
          } else if (v !== undefined) {
            queryParams.append(k, String(v));
          }
        }
        const qs = queryParams.toString();
        req.url = '/api/' + subPath + (qs ? '?' + qs : '');
      } else {
        const matched =
          req.headers['x-matched-path'] ||
          req.headers['x-vercel-matched-path'] ||
          req.headers['x-forwarded-uri'] ||
          req.headers['x-original-url'];

        if (matched && typeof matched === 'string' && matched.startsWith('/api')) {
          req.url = matched;
        }
      }

      // Safeguard for pre-parsed body
      if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
        try {
          req.body = JSON.parse(req.body);
          req._body = true;
        } catch {}
      } else if (req.body && typeof req.body === 'object') {
        req._body = true;
      }

      app(req, res, (err: any) => {
        if (err && !res.headersSent) {
          console.error('Express unhandled error:', err);
          res.status(500).json({
            error: err?.message || 'Server error',
            code: 'EXPRESS_UNHANDLED'
          });
        }
        resolve(null);
      });
    } catch (err: any) {
      console.error('🔴 [SERVERLESS_INVOCATION_EXCEPTION]:', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: err?.message || 'Serverless invocation failed',
          code: 'INVOCATION_EXCEPTION',
          details: String(err)
        });
      }
      resolve(null);
    }
  });
}
