import app, { ensureDbReady } from '../server/src/server.js';

export default async function handler(req, res) {
  // Ensure database tables and initial seeds exist in serverless cold start
  await ensureDbReady();
  return app(req, res);
}
