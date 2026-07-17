import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      fullName,
      dateOfBirth,
      nationality,
      country,
      address,
      phoneNumber,
      occupation,
      idType,
      idNumber,
      expiryDate,
      idFrontUrl,
      idBackUrl,
      selfieUrl,
    } = body;

    // Validate required fields
    if (
      !fullName ||
      !dateOfBirth ||
      !nationality ||
      !country ||
      !address ||
      !phoneNumber ||
      !occupation ||
      !idType ||
      !idNumber ||
      !idFrontUrl
    ) {
      return NextResponse.json({ error: "Please fill in all required fields and upload the front of your ID." }, { status: 400 });
    }

    const parsedDob = new Date(dateOfBirth);
    if (isNaN(parsedDob.getTime())) {
      return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or update Verification record
    const verification = await prisma.verification.upsert({
      where: { userId: user.id },
      update: {
        fullName,
        dateOfBirth: parsedDob,
        nationality,
        country,
        address,
        phoneNumber,
        occupation,
        idType,
        idNumber,
        expiryDate: expiryDate || null,
        idFrontUrl,
        idBackUrl: idBackUrl || null,
        selfieUrl: selfieUrl || null,
        verificationStatus: "Pending Review",
        rejectionReason: null,
        submittedAt: new Date(),
      },
      create: {
        userId: user.id,
        fullName,
        dateOfBirth: parsedDob,
        nationality,
        country,
        address,
        phoneNumber,
        occupation,
        idType,
        idNumber,
        expiryDate: expiryDate || null,
        idFrontUrl,
        idBackUrl: idBackUrl || null,
        selfieUrl: selfieUrl || null,
        verificationStatus: "Pending Review",
        rejectionReason: null,
      },
    });

    // Update user status back to UNVERIFIED (since they are pending approval now)
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "UNVERIFIED" },
    });

    // Create a notification inside the system
    await prisma.notification.create({
      data: {
        userEmail: user.email,
        title: "Verification Documents Received",
        message: "Your identity verification documents have been received and are currently under review by our compliance team. We will notify you once the review is complete.",
        type: "info",
      },
    });

    // Log the verification action in the audit log
    await prisma.auditLog.create({
      data: {
        action: "KYC_SUBMITTED",
        details: `User ${user.email} submitted KYC identity documents for verification.`,
      },
    });

    // Send email notification
    await sendEmail({
      to: user.email,
      subject: "Verification Received",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">Identity Verification Under Review</h2>
          <p>Hello ${fullName || user.name},</p>
          <p>Thank you for submitting your identity documents for verification on Prime Wealth.</p>
          <p>Our compliance team is currently reviewing your submission. This process typically takes between 24-48 hours.</p>
          <p>We will notify you via email as soon as your account status is updated.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is an automated notification. Please do not reply directly to this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error("[Verification Submission API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
