import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ensureDbInitialized } from './db/init.js';
import authRoutes from './routes/auth.js';
import stationsRoutes from './routes/stations.js';
import videosRoutes from './routes/videos.js';
import categoriesRoutes from './routes/categories.js';
import analyticsRoutes from './routes/analytics.js';
import usersRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import commentsRoutes from './routes/comments.js';
import donationsRoutes from './routes/donations.js';
import feedbackRoutes from './routes/feedback.js';
import adsRoutes from './routes/ads.js';

const app = express();

// CORS configuration supporting tv.benix.space and local dev
const allowedOrigins = [
  'https://tv.benix.space',
  'http://tv.benix.space',
  'https://rba.benix.space',
  'http://rba.benix.space',
  'https://rba.co.rw',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.benix.space') || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in production for streaming consumers
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware: Auto-initialize DB on first request (critical for Vercel deployment)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (err) {
    console.error('Database connection / migration failure during request:', err);
    next(); // Proceed to allow error reporting rather than hanging
  }
});

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'RBA Streaming Platform API',
    domain: 'tv.benix.space',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ads', adsRoutes);



// 404 handler for unknown API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

export default app;
