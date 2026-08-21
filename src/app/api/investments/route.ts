import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as z from "zod";
import { sendPushNotification } from "@/lib/push";

import { PLAN_IDS, INVESTMENT_PLANS } from "@/lib/config";

const investmentSchema = z.object({
  plan: z.enum(PLAN_IDS),
  amount: z.number().positive(),
});

const PLAN_DETAILS = Object.fromEntries(
  INVESTMENT_PLANS.map(plan => [plan.id, { roi: plan.roi, durationDays: plan.duration, minAmount: plan.min }])
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const investments = await prisma.investment.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" }
    });

    return NextResponse.json(investments);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (session.user.status === "suspended") {
      return NextResponse.json({ success: false, message: "Account is suspended." }, { status: 403 });
    }

    const body = await req.json();
    const { plan, amount } = investmentSchema.parse(body);

    const planConfig = PLAN_DETAILS[plan];
    if (amount < planConfig.minAmount) {
      return NextResponse.json({
        success: false,
        message: `Minimum investment for the ${plan} plan is $${planConfig.minAmount.toLocaleString()}.`
      }, { status: 400 });
    }

    // Process via database transaction to ensure balance integrity
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: session.user.id } });
      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.balance < amount) throw new Error("INSUFFICIENT_FUNDS");

      // Deduct balance and increment active investments
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: amount },
          investments: { increment: amount }
        }
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + planConfig.durationDays);

      const profit = parseFloat((amount * (planConfig.roi / 100)).toFixed(2));

      // Create Investment
      const investment = await tx.investment.create({
        data: {
          userId: user.id,
          plan,
          amount,
          roi: planConfig.roi,
          duration: planConfig.durationDays,
          profit,
          status: "active",
          startDate,
          endDate,
        }
      });

      // Create Transaction log
      await tx.transaction.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          type: "investment",
          amount,
          category: "Investments",
          description: `Allocated $${amount.toLocaleString()} to ${plan} Yield Plan`,
          status: "completed",
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "INVESTMENT_STARTED",
          details: `User ${user.email} allocated $${amount} to ${plan} Plan (ROI: ${planConfig.roi}%, Duration: ${planConfig.durationDays} days).`,
        }
      });

      return { success: true, investment, user: updatedUser, userEmail: user.email, userName: user.name, endDate };
    });

    // Send push notifications outside the interactive transaction
    sendPushNotification({
      userEmail: result.userEmail,
      title: "Investment Plan Activated",
      message: `Your $${amount.toLocaleString()} ${plan} plan is now active! Expected payout date: ${result.endDate.toLocaleDateString()}.`,
      type: "success",
      url: "/dashboard/investments",
    }).catch((e) => console.warn("Client investment push failed:", e));

    sendPushNotification({
      userEmail: "admin",
      title: "New Investment Created",
      message: `Client ${result.userName} allocated $${amount.toLocaleString()} to ${plan} Plan.`,
      type: "info",
      url: "/admin/transactions",
    }).catch((e) => console.warn("Admin investment alert push failed:", e));

    return NextResponse.json({ success: true, investment: result.investment, user: result.user });
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ success: false, message: "User profile not found." }, { status: 404 });
    }
    if (error.message === "INSUFFICIENT_FUNDS") {
      return NextResponse.json({ success: false, message: "Insufficient balance to purchase this investment plan." }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid payload parameters." }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
