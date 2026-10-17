import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { initDatabase } from './config/initDb.js';
import authRoutes from './routes/auth.routes.js';
import stationsRoutes from './routes/stations.routes.js';
import brandingRoutes from './routes/branding.routes.js';
import streamsRoutes from './routes/streams.routes.js';
import programsRoutes from './routes/programs.routes.js';
import newsRoutes from './routes/news.routes.js';
import videosRoutes from './routes/videos.routes.js';
import sectionsRoutes from './routes/sections.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import radioRequestsRoutes from './routes/radioRequests.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local uploaded files if existing
const uploadsPath = path.join(process.cwd(), 'uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Radio Station Platform API'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationsRoutes);
app.use('/api/stations', brandingRoutes);
app.use('/api/stations', streamsRoutes);
app.use('/api/stations', programsRoutes);
app.use('/api/stations', newsRoutes);
app.use('/api/stations', videosRoutes);
app.use('/api/stations', sectionsRoutes);
app.use('/api/stations', settingsRoutes);
app.use('/api/stations', analyticsRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/requests', radioRequestsRoutes);
app.use('/api/notifications', notificationsRoutes);

// In production, serve frontend build if present
const clientDist = fs.existsSync(path.join(process.cwd(), 'dist'))
  ? path.join(process.cwd(), 'dist')
  : path.join(__dirname, '..', '..', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred.'
  });
});

// Auto-initialize DB and start server (if running directly, not imported in Vercel serverless)
let isInitialized = false;
export async function ensureDbReady() {
  if (!isInitialized) {
    try {
      await initDatabase();
      isInitialized = true;
    } catch (e) {
      console.error('[DB] Auto-initialization failed:', e);
    }
  }
}

// Start HTTP server if not imported by Vercel
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  ensureDbReady().then(() => {
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🎙️  Radio Platform Server running on port ${PORT}`);
      console.log(`📡  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  });
}

export { app };
export default app;
