import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

// GET: Fetch all verification requests (Admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verifications = await prisma.verification.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            avatar: true,
            joinedDate: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json(verifications);
  } catch (error) {
    console.error("[Admin Verifications GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Approve or reject verification requests (Admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { verificationId, action, rejectionReason } = body;

    if (!verificationId || !action || !["approve", "reject", "resubmit"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Find verification record
    const verification = await prisma.verification.findUnique({
      where: { id: verificationId },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json({ error: "Verification request not found" }, { status: 404 });
    }

    const adminEmail = session.user.email || "System Admin";

    if (action === "approve") {
      // Update verification record
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          verificationStatus: "Approved",
          rejectionReason: null,
          reviewedBy: adminEmail,
          reviewedAt: new Date(),
        },
      });

      // Update user account status
      await prisma.user.update({
        where: { id: verification.userId },
        data: { status: "VERIFIED" },
      });

      // Create internal notification
      await prisma.notification.create({
        data: {
          userEmail: verification.user.email,
          title: "Identity Verification Approved",
          message: "Congratulations! Your identity has been verified successfully. Your account is now fully verified and all platform features have been unlocked.",
          type: "success",
        },
      });

      // Log in the audit log
      await prisma.auditLog.create({
        data: {
          action: "KYC_APPROVED",
          details: `Admin ${adminEmail} approved KYC verification for user ${verification.user.email}.`,
          adminId: session.user.id,
        },
      });

      // Send email notification
      await sendEmail({
        to: verification.user.email,
        subject: "Identity Verification Approved",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #10b981; margin-bottom: 20px;">Identity Verification Approved</h2>
            <p>Hello ${verification.fullName || verification.user.name},</p>
            <p>Great news! Your identity verification documents have been reviewed and approved by our compliance team.</p>
            <p>Your Prime Wealth account is now fully <strong>VERIFIED</strong>. You can now use all the platform's advanced wealth building services, execute asset wires, and invest in yield contracts without restrictions.</p>
            <div style="margin: 30px 0; text-align: center;">
              <span style="background-color: #10b981; color: white; padding: 10px 20px; font-weight: bold; border-radius: 6px; font-size: 16px;">✔ Verified Account</span>
            </div>
            <p>If you have any questions, please contact our support chat.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `,
      });

      return NextResponse.json({ success: true, message: "Verification approved successfully" });
    } else if (action === "reject") {
      // Reject action
      if (!rejectionReason || rejectionReason.trim() === "") {
        return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
      }

      // Update verification record
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          verificationStatus: "Rejected",
          rejectionReason: rejectionReason,
          reviewedBy: adminEmail,
          reviewedAt: new Date(),
        },
      });

      // Update user account status
      await prisma.user.update({
        where: { id: verification.userId },
        data: { status: "REJECTED" },
      });

      // Create internal notification
      await prisma.notification.create({
        data: {
          userEmail: verification.user.email,
          title: "Identity Verification Rejected",
          message: `Unfortunately, your identity verification could not be approved. Reason: ${rejectionReason}.`,
          type: "alert",
        },
      });

      // Log in the audit log
      await prisma.auditLog.create({
        data: {
          action: "KYC_REJECTED",
          details: `Admin ${adminEmail} rejected KYC verification for user ${verification.user.email}. Reason: ${rejectionReason}`,
          adminId: session.user.id,
        },
      });

      // Send email notification
      await sendEmail({
        to: verification.user.email,
        subject: "Identity Verification Rejected",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #ef4444; margin-bottom: 20px;">Identity Verification Rejected</h2>
            <p>Hello ${verification.fullName || verification.user.name},</p>
            <p>We are writing to let you know that our compliance team has rejected your identity verification submission.</p>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <strong style="color: #991b1b; display: block; margin-bottom: 5px;">Rejection Reason:</strong>
              <p style="margin: 0; color: #7f1d1d; font-size: 14px;">${rejectionReason}</p>
            </div>
            <p>If you believe this was an error, please reach out via our support chat channel.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `,
      });

      return NextResponse.json({ success: true, message: "Verification rejected successfully" });
    } else if (action === "resubmit") {
      // Request Resubmission action
      if (!rejectionReason || rejectionReason.trim() === "") {
        return NextResponse.json({ error: "Resubmission reason is required." }, { status: 400 });
      }

      // Update verification record
      await prisma.verification.update({
        where: { id: verificationId },
        data: {
          verificationStatus: "Request Resubmission",
          rejectionReason: rejectionReason,
          reviewedBy: adminEmail,
          reviewedAt: new Date(),
        },
      });

      // Update user account status
      await prisma.user.update({
        where: { id: verification.userId },
        data: { status: "UNVERIFIED" },
      });

      // Create internal notification
      await prisma.notification.create({
        data: {
          userEmail: verification.user.email,
          title: "Identity Verification Requires Attention",
          message: `Your identity verification requires resubmission. Reason: ${rejectionReason}. Please visit the verification page to submit new documents.`,
          type: "alert",
        },
      });

      // Log in the audit log
      await prisma.auditLog.create({
        data: {
          action: "KYC_RESUBMISSION_REQUESTED",
          details: `Admin ${adminEmail} requested KYC resubmission for user ${verification.user.email}. Reason: ${rejectionReason}`,
          adminId: session.user.id,
        },
      });

      // Send email notification
      await sendEmail({
        to: verification.user.email,
        subject: "Additional Documents Required",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #f59e0b; margin-bottom: 20px;">Additional Documents Required</h2>
            <p>Hello ${verification.fullName || verification.user.name},</p>
            <p>We are writing to let you know that our compliance team requires additional information or clearer documents to approve your identity verification.</p>
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <strong style="color: #b45309; display: block; margin-bottom: 5px;">What needs to be corrected:</strong>
              <p style="margin: 0; color: #92400e; font-size: 14px;">${rejectionReason}</p>
            </div>
            <p>Please log in to your dashboard and navigate to the identity verification page to submit the required documents.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `,
      });

      return NextResponse.json({ success: true, message: "Verification resubmission requested successfully" });
    }
  } catch (error) {
    console.error("[Admin Verifications POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
