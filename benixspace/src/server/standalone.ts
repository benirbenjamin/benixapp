import path from 'path';
import fs from 'fs';
import express from 'express';
import app from './index';

// Locate static dist directory flexibly
const possibleDistDirs = [
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, 'dist'),
  path.resolve(__dirname, '..', 'dist'),
  path.resolve(__dirname, '../..', 'dist')
];

let distDir = possibleDistDirs.find(d => fs.existsSync(path.join(d, 'index.html'))) || possibleDistDirs[0];

// Serve static frontend assets from dist
app.use(express.static(distDir, {
  maxAge: '1d',
  index: false
}));

// SPA Catch-all: send index.html for all non-API GET requests (Express 5 safe)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  if (req.path.startsWith('/api') || req.path.startsWith('/robots.txt') || req.path.startsWith('/sitemap.xml')) {
    return next();
  }
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return next();
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🌐 BenixSpace Unified Platform running in Standalone Production mode on port ${PORT}`);
  console.log(`📂 Static assets served from: ${distDir}`);
});

export default server;
