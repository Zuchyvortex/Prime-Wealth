import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

const balanceSchema = z.object({
  userId: z.string(),
  balance: z.number().nonnegative().optional(),
  savings: z.number().nonnegative().optional(),
  investments: z.number().nonnegative().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, balance, savings, investments } = balanceSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, number> = {};
    const changes: string[] = [];

    if (balance !== undefined) {
      updateData.balance = balance;
      changes.push(`liquid balance: $${user.balance.toLocaleString()} -> $${balance.toLocaleString()}`);
    }
    if (savings !== undefined) {
      updateData.savings = savings;
      changes.push(`savings: $${user.savings.toLocaleString()} -> $${savings.toLocaleString()}`);
    }
    if (investments !== undefined) {
      updateData.investments = investments;
      changes.push(`investments: $${user.investments.toLocaleString()} -> $${investments.toLocaleString()}`);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, message: "No updates specified" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Create Audit Trail
    await prisma.auditLog.create({
      data: {
        action: "ADMIN_ADJUST_BALANCE",
        adminId: session.user.id,
        details: `Admin ${session.user.email} modified assets profile of ${user.email}. Adjustments: ${changes.join(", ")}`,
      }
    });

    // Create User Alert Notification
    await prisma.notification.create({
      data: {
        userEmail: user.email,
        title: "Vault Balance Adjusted",
        message: `Your asset parameters have been adjusted by administration. Updates: ${changes.join(", ")}.`,
        type: "info"
      }
    });

    return NextResponse.json({ success: true, message: "User balances updated and logged." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload parameters" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
