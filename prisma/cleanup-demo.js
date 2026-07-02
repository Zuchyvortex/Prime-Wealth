const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanup() {
  console.log("🗑️  Removing demo and regular user accounts from database...");

  // Delete all non-admin users (cascade deletes their cards, transactions, notifications, etc.)
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: "user" },
  });
  console.log(`✅ Deleted ${deletedUsers.count} user account(s).`);

  // Remove demo seed audit logs
  const deletedLogs = await prisma.auditLog.deleteMany({
    where: {
      OR: [{ id: "seed-audit-001" }, { id: "seed-audit-002" }],
    },
  });
  console.log(`✅ Deleted ${deletedLogs.count} demo audit log(s).`);

  console.log("\n✅ Database is now clean — only admin account remains.");
  console.log("   Users must register via /register going forward.\n");
}

cleanup()
  .catch((e) => {
    console.error("❌ Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
