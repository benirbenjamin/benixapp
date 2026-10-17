const { execSync } = require("child_process");

console.log("\n=======================================================");
console.log("   UMUGUZIPRO — VERCEL PRODUCTION BUILD STEP");
console.log("=======================================================\n");

// 1. Generate Prisma Client
console.log("Step 1: Generating Prisma Client...");
try {
  execSync("npx prisma@5.21.1 generate", { stdio: "inherit" });
} catch (err) {
  try {
    execSync("prisma generate", { stdio: "inherit" });
  } catch (err2) {
    console.warn("Prisma generate fallback failed:", err2.message);
  }
}

// 2. Push database schema if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  console.log("\nStep 2: Synchronizing PostgreSQL schema with prisma db push...");
  try {
    execSync("npx prisma db push --skip-generate --accept-data-loss", { stdio: "inherit" });
    console.log("✅ Database tables successfully synchronized.");
  } catch (err) {
    console.warn("⚠️ Note: prisma db push skipped or deferred:", err.message);
  }
} else {
  console.log("\nStep 2: DATABASE_URL not detected in build environment. Skipping db push.");
}

// 3. Run Next.js build
console.log("\nStep 3: Running Next.js production build...");
try {
  execSync("next build", { stdio: "inherit" });
} catch (err) {
  process.exit(1);
}
