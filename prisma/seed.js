const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPasswordPlain) {
    console.log("⚠️  ADMIN_EMAIL or ADMIN_PASSWORD environment variables not set. Skipping admin creation.");
    return;
  }

  const adminPassword = await bcrypt.hash(adminPasswordPlain, 12);

  // ── ADMIN ACCOUNT ──────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "System Administrator",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      status: "active",
      tier: "elite",
      balance: 0,
      savings: 0,
      investments: 0,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      phone: "+1 (555) 000-0000",
      job: "System Administrator",
    },
  });
  console.log(`✅ Admin verified: ${admin.email}`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
