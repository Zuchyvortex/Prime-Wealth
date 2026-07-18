const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApprove() {
  try {
    const verification = await prisma.verification.findFirst({
      include: { user: true }
    });
    
    if (!verification) {
      console.log("No verification found");
      return;
    }

    console.log("Found verification:", verification.id, "User:", verification.user.email);

    // 1. Update verification record
    await prisma.verification.update({
      where: { id: verification.id },
      data: {
        verificationStatus: "Approved",
        rejectionReason: null,
        reviewedBy: "admin@test.com",
        reviewedAt: new Date(),
      },
    });
    console.log("Updated verification");

    // 2. Update user account status
    await prisma.user.update({
      where: { id: verification.userId },
      data: { status: "VERIFIED" },
    });
    console.log("Updated user status");

    // 3. Create internal notification
    await prisma.notification.create({
      data: {
        userEmail: verification.user.email,
        title: "Identity Verification Approved",
        message: "Congratulations! Your identity has been verified successfully. Your account is now fully verified and all platform features have been unlocked.",
        type: "success",
      },
    });
    console.log("Created notification");

    // 4. Log in the audit log
    await prisma.auditLog.create({
      data: {
        action: "KYC_APPROVED",
        details: `Admin admin@test.com approved KYC verification for user ${verification.user.email}.`,
        adminId: "mock-admin-id",
      },
    });
    console.log("Created audit log");

    console.log("All success");
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testApprove();
