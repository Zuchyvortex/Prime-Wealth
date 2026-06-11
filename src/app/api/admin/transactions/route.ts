import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action } = body; // action: "approve" | "decline"

    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.status !== "pending") {
      return NextResponse.json({ error: "Invalid transaction" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: tx.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "approve") {
      if (tx.type === "deposit") {
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: { increment: tx.amount } }
        });
      } else if (tx.type === "withdrawal") {
        if (user.balance < tx.amount) {
          return NextResponse.json({ error: "User has insufficient balance to settle this withdrawal request" }, { status: 400 });
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: tx.amount } }
        });
      }
    }

    const finalStatus = action === "approve" ? "completed" : "failed";

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { status: finalStatus }
    });

    await prisma.notification.create({
      data: {
        userEmail: tx.userEmail,
        title: action === "approve" ? "Transaction Cleared" : "Transaction Declined",
        message: action === "approve"
          ? `Your ${tx.type} of $${tx.amount.toLocaleString()} has been approved and settled.`
          : `Your ${tx.type} of $${tx.amount.toLocaleString()} was declined by safety operations.`,
        type: action === "approve" ? "success" : "alert",
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        action: action === "approve" ? "TRANSACTION_APPROVED" : "TRANSACTION_DECLINED",
        adminId: session.user.id,
        details: `Admin ${session.user.email} ${action}d transaction ID ${tx.id} for user ${user.email}. Type: ${tx.type}, Amount: $${tx.amount}.`,
      }
    });

    return NextResponse.json({ success: true, message: `Transaction ${action}d successfully` });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
