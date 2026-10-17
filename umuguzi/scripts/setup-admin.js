/**
 * STANDALONE SUPER ADMIN PROVISIONING SCRIPT
 * ----------------------------------------------------------------------------
 * Immediately creates or resets benirabok@gmail.com as SUPER_ADMIN with password: 1202!birthDATE
 * Usage: node scripts/setup-admin.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function setupSuperAdmin() {
  console.log("\n=======================================================");
  console.log("   PROVISIONING PRIMARY SUPER ADMIN (benirabok@gmail.com)");
  console.log("=======================================================\n");

  const email = "benirabok@gmail.com";
  const password = "1202!birthDATE";
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: "SUPER_ADMIN",
        isVerified: true,
        twoFactorEnabled: false,
        isBanned: false,
      },
      create: {
        email,
        username: "benir",
        displayName: "Benir Benjamin",
        passwordHash,
        role: "SUPER_ADMIN",
        isVerified: true,
        twoFactorEnabled: false,
        country: "Rwanda",
        city: "Kigali",
        wallet: {
          create: {
            availableBalance: 5000000,
            pendingBalance: 0,
            totalEarnings: 5000000,
            totalWithdrawn: 0,
            currency: "RWF",
          },
        },
      },
    });

    console.log("✅ Super Admin Account Configured Successfully!");
    console.log(`   Email:        ${user.email}`);
    console.log(`   Username:     @${user.username}`);
    console.log(`   Role:         ${user.role}`);
    console.log(`   Password:     ${password}`);
    console.log(`   Verified:     ${user.isVerified}`);
    console.log(`   2FA Required: ${user.twoFactorEnabled}`);

    // Ensure Channel
    const channel = await prisma.channel.upsert({
      where: { handle: "benir" },
      update: {},
      create: {
        ownerId: user.id,
        name: "Benir Official",
        handle: "benir",
        description: "Official Channel of Benir Benjamin on Umuguzipro Rwanda.",
        subscriberCount: 25000,
        totalViews: 350000,
        isVerified: true,
      },
    });

    console.log(`   Channel:      ${channel.name} (@${channel.handle})\n`);
  } catch (error) {
    console.error("❌ Failed to provision Super Admin:", error.message);
    console.warn("   Please verify PostgreSQL server connection and DATABASE_URL in .env");
  } finally {
    await prisma.$disconnect();
  }
}

setupSuperAdmin();
