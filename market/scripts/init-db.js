/**
 * UMUGUZIPRO SAFE DATABASE INITIALIZATION SCRIPT
 * ----------------------------------------------------------------------------
 * Idempotent, non-destructive schema migration and seeding.
 * Never resets the database or drops existing production tables.
 */

const { execSync } = require("child_process");

async function initDatabase() {
  console.log("\n=======================================================");
  console.log("   UMUGUZIPRO — SAFE DATABASE INITIALIZATION");
  console.log("=======================================================\n");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("⚠️ WARNING: DATABASE_URL is not set in environment.");
    console.warn("   Please set DATABASE_URL (Neon, Supabase, Vercel PG, or local PostgreSQL) in your .env file.");
    console.warn("   Example: DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/umuguzi?schema=public\"\n");
    return;
  }

  console.log("1. Checking and synchronizing PostgreSQL schema with Prisma...");
  try {
    // npx prisma db push --skip-generate ensures additive schema changes without deleting existing data
    execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
    console.log("   ✅ Database schema is synchronized successfully.");
  } catch (err) {
    console.error("   ❌ Failed to synchronize database schema:", err.message);
    console.warn("   Please ensure your PostgreSQL server is running and reachable.");
    return;
  }

  console.log("\n2. Executing safe idempotent seed data...");
  try {
    require("./seed.js");
  } catch (err) {
    console.error("   ❌ Seeding encountered an error:", err.message);
  }
}

initDatabase();
