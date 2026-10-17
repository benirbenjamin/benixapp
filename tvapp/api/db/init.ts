import { runMigrations } from './migrate.js';
import { seedDatabase } from './seed.js';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized() {
  if (isInitialized) return;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log('🚀 Checking database status and ensuring tables exist...');
        await runMigrations();
        await seedDatabase();
        isInitialized = true;
        console.log('✨ Database ready.');
      } catch (err) {
        console.error('⚠️ Database initialization error:', err);
        // Allow retry next time if connection failed
        initPromise = null;
        throw err;
      }
    })();
  }

  return initPromise;
}
