import { prisma } from "./prisma";

/**
 * Scans and processes matured investments for a user.
 * Credits user balance, deducts active investments total,
 * creates transaction & notification logs, and writes an audit log.
 * Prevents double-processing using Prisma transactions.
 */
export async function checkAndMatureInvestments(userId: string) {
  const now = new Date();

  // Find all active investments for this user that have reached their end date
  const matureInvestments = await prisma.investment.findMany({
    where: {
      userId,
      status: "active",
      endDate: { lte: now }
    },
    include: {
      user: true
    }
  });

  if (matureInvestments.length === 0) {
    return;
  }

  for (const inv of matureInvestments) {
    try {
      await prisma.$transaction(async (tx) => {
        // Fetch to verify current state is still active within transaction
        const freshInv = await tx.investment.findUnique({
          where: { id: inv.id }
        });

        if (!freshInv || freshInv.status !== "active") {
          return; // Already processed
        }

        // 1. Mark investment as completed
        await tx.investment.update({
          where: { id: inv.id },
          data: { status: "completed" }
        });

        const totalPayout = inv.amount + inv.profit;

        // 2. Update user's aggregate values
        // Note: active investments total decrements by principal, balance increments by principal + profit
        await tx.user.update({
          where: { id: inv.userId },
          data: {
            balance: { increment: totalPayout },
            investments: { decrement: inv.amount }
          }
        });

        // 3. Create historical Transaction record
        await tx.transaction.create({
          data: {
            userId: inv.userId,
            userEmail: inv.user.email,
            userName: inv.user.name,
            type: "profit_payout",
            amount: totalPayout,
            category: "Investments",
            description: `Payout for matured ${inv.plan} investment plan`,
            status: "completed",
          }
        });

        // 4. Create Notification log
        await tx.notification.create({
          data: {
            userEmail: inv.user.email,
            title: "Investment Plan Matured",
            message: `Your ${inv.plan} investment has matured! $${totalPayout.toLocaleString()} has been credited to your primary vault.`,
            type: "success",
          }
        });

        // 5. Create Audit Log
        await tx.auditLog.create({
          data: {
            action: "INVESTMENT_MATURED",
            details: `Investment ID ${inv.id} for user ${inv.user.email} successfully matured. Principal: $${inv.amount}, Profit: $${inv.profit}, Total Payout: $${totalPayout}.`,
          }
        });
      });
      console.log(`✅ Investment matured successfully: ${inv.id}`);
    } catch (error) {
      console.error(`❌ Error maturing investment ${inv.id}:`, error);
    }
  }
}
