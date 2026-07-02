const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);

  // ── ADMIN ACCOUNT ──────────────────────────────────────────────
  // This is the ONLY account created by the seed.
  // All regular user accounts must be created via /register.
  // Admin accounts must NEVER be created via public registration.
  const admin = await prisma.user.upsert({
    where: { email: "admin@primewealth.com" },
    update: {},
    create: {
      name: "Sarah Jenkins",
      email: "admin@primewealth.com",
      password: adminPassword,
      role: "admin",
      status: "active",
      tier: "elite",
      balance: 0,
      savings: 0,
      investments: 0,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      phone: "+1 (555) 000-0001",
      job: "System Administrator",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Admin Credentials:");
  console.log("─────────────────────────────────────────");
  console.log("  URL:      /admin/login");
  console.log("  Email:    admin@primewealth.com");
  console.log("  Password: admin123");
  console.log("─────────────────────────────────────────");
  console.log("\n⚠️  Change the admin password after first login.");
  console.log("   Regular users: register via /register\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
