const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Hash passwords
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user1234", 12);

  // ── ADMIN ACCOUNT ──────────────────────────────────────────────
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

  // ── DEMO USER ACCOUNT ──────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: "john@primewealth.com" },
    update: {},
    create: {
      name: "John Mitchell",
      email: "john@primewealth.com",
      password: userPassword,
      role: "user",
      status: "active",
      tier: "growth",
      balance: 24850.00,
      savings: 8200.00,
      investments: 15600.00,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      phone: "+1 (555) 123-4567",
      job: "Private Equity Analyst",
      cards: {
        create: [
          {
            number: "4532 1234 5678 9012",
            name: "John Mitchell",
            expiry: "12/27",
            cvv: "123",
            type: "visa",
            balance: 5000.00,
          },
        ],
      },
      notifications: {
        create: [
          {
            title: "Welcome to PrimeWealth",
            message: "Your account has been successfully created. Explore your dashboard to get started.",
            type: "info",
            read: false,
          },
          {
            title: "Account Verified",
            message: "Your identity has been verified. You now have full access to all features.",
            type: "success",
            read: false,
          },
        ],
      },
      transactions: {
        create: [
          {
            userEmail: "john@primewealth.com",
            userName: "John Mitchell",
            type: "deposit",
            amount: 10000,
            category: "Salary",
            description: "Monthly salary deposit",
            status: "completed",
          },
          {
            userEmail: "john@primewealth.com",
            userName: "John Mitchell",
            type: "withdrawal",
            amount: 500,
            category: "Utilities",
            description: "Monthly utility bills",
            status: "completed",
          },
          {
            userEmail: "john@primewealth.com",
            userName: "John Mitchell",
            type: "deposit",
            amount: 5000,
            category: "Investments",
            description: "Investment returns",
            status: "pending",
          },
        ],
      },
    },
  });
  console.log(`✅ Demo user created: ${user.email}`);

  // ── DEMO ACTIVE INVESTMENT ──────────────────────────────────────
  // This investment is already past its end date so the maturity engine
  // fires immediately on the user's first profile load.
  const pastEndDate = new Date();
  pastEndDate.setDate(pastEndDate.getDate() - 1); // Yesterday

  const pastStartDate = new Date();
  pastStartDate.setDate(pastStartDate.getDate() - 8); // 8 days ago (7-day Starter plan)

  await prisma.investment.upsert({
    where: { id: "seed-investment-001" },
    update: {},
    create: {
      id: "seed-investment-001",
      userId: user.id,
      plan: "Starter",
      amount: 1000,
      roi: 5,
      duration: 7,
      profit: 50,
      status: "active",
      startDate: pastStartDate,
      endDate: pastEndDate,
    }
  });
  console.log(`✅ Demo investment created (past maturity - will trigger on login)`);

  // ── DEMO AUDIT LOG ENTRIES ──────────────────────────────────────
  await prisma.auditLog.upsert({
    where: { id: "seed-audit-001" },
    update: {},
    create: {
      id: "seed-audit-001",
      action: "DEPOSIT_SUBMITTED",
      details: `User john@primewealth.com submitted deposit request of $10000 via Bitcoin. Hash/Proof: 3abc12de...seed_demo.`,
    }
  });
  await prisma.auditLog.upsert({
    where: { id: "seed-audit-002" },
    update: {},
    create: {
      id: "seed-audit-002",
      action: "TRANSACTION_APPROVED",
      adminId: admin.id,
      details: `Admin admin@primewealth.com approved transaction for user john@primewealth.com. Type: deposit, Amount: $10000.`,
    }
  });

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Login Credentials:");
  console.log("─────────────────────────────────");
  console.log("  ADMIN:  admin@primewealth.com  /  admin123");
  console.log("  USER:   john@primewealth.com   /  user1234");
  console.log("─────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
