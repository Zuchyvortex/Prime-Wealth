import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

const investmentSchema = z.object({
  plan: z.enum(["Starter", "Growth", "Elite"]),
  amount: z.number().positive(),
});

const PLAN_DETAILS = {
  Starter: { roi: 5, durationDays: 7, minAmount: 500 },
  Growth: { roi: 12, durationDays: 30, minAmount: 5000 },
  Elite: { roi: 25, durationDays: 90, minAmount: 25000 },
};

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

      // Create Notification log
      await tx.notification.create({
        data: {
          userEmail: user.email,
          title: "Investment Plan Activated",
          message: `Your $${amount.toLocaleString()} ${plan} plan is now active! Expected payout date: ${endDate.toLocaleDateString()}.`,
          type: "success",
        }
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          action: "INVESTMENT_STARTED",
          details: `User ${user.email} allocated $${amount} to ${plan} Plan (ROI: ${planConfig.roi}%, Duration: ${planConfig.durationDays} days).`,
        }
      });

      return { success: true, investment, user: updatedUser };
    });

    return NextResponse.json(result);
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
