import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["deposit", "withdrawal", "transfer_send"]),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string(),
  targetEmail: z.string().email().optional().or(z.literal("")),
  method: z.string().optional().nullable(),
  proof: z.string().optional().nullable(),
});

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
    const { type, amount, category, description, targetEmail, method, proof } = transactionSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (type === "transfer_send") {
      if (user.balance < amount) {
        return NextResponse.json({ success: false, message: "Insufficient balance" }, { status: 400 });
      }
      if (!targetEmail) {
        return NextResponse.json({ success: false, message: "Target email required for transfers" }, { status: 400 });
      }
      
      const recipient = await prisma.user.findUnique({ where: { email: targetEmail.toLowerCase() } });
      
      // Update sender balance
      await prisma.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } }
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          type: "transfer_send",
          amount,
          category,
          description,
          status: "completed",
          targetEmail: targetEmail.toLowerCase()
        }
      });

      await prisma.notification.create({
        data: {
          userEmail: user.email,
          title: "Transfer Sent",
          message: `You successfully transferred $${amount.toLocaleString()} to ${targetEmail}.`,
          type: "success",
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "TRANSFER_SENT",
          details: `User ${user.email} sent $${amount} to ${targetEmail}.`,
        }
      });

      if (recipient) {
        await prisma.user.update({
          where: { id: recipient.id },
          data: { balance: { increment: amount } }
        });
        
        await prisma.transaction.create({
          data: {
            userId: recipient.id,
            userEmail: recipient.email,
            userName: recipient.name,
            type: "transfer_receive",
            amount,
            category,
            description: `${description} (from ${user.name})`,
            status: "completed",
            targetEmail: user.email
          }
        });

        await prisma.notification.create({
          data: {
            userEmail: recipient.email,
            title: "Funds Received",
            message: `You received $${amount.toLocaleString()} from ${user.name}.`,
            type: "success",
          }
        });
      }

      return NextResponse.json({ success: true, message: `Successfully sent $${amount.toLocaleString()}!` });
    }

    if (type === "deposit") {
      if (!method || !proof || !proof.trim()) {
        return NextResponse.json({ success: false, message: "Deposit method and transaction hash (TXID) are required." }, { status: 400 });
      }

      const sanitizedProof = proof.trim();

      // Prevent duplicate TXID submissions
      const existingTx = await prisma.transaction.findFirst({
        where: {
          type: "deposit",
          proof: sanitizedProof
        }
      });

      if (existingTx) {
        return NextResponse.json({ success: false, message: "This Transaction Hash (TXID) has already been submitted." }, { status: 400 });
      }

      await prisma.transaction.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          type: "deposit",
          amount,
          category,
          description: `Deposit via ${method}`,
          status: "pending",
          method,
          proof: sanitizedProof,
        }
      });

      await prisma.notification.create({
        data: {
          userEmail: user.email,
          title: "Deposit Submitted",
          message: `Your deposit request of $${amount.toLocaleString()} via ${method} has been submitted and is awaiting administrator verification.`,
          type: "info",
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "DEPOSIT_SUBMITTED",
          details: `User ${user.email} submitted deposit request of $${amount} via ${method}. Hash/Proof: ${sanitizedProof}`,
        }
      });

      return NextResponse.json({ success: true, message: `Deposit request of $${amount.toLocaleString()} submitted successfully.` });
    }

    if (type === "withdrawal") {
      // Calculate pending withdrawals to prevent overdraft double-pending
      const pendingWithdrawals = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          type: "withdrawal",
          status: "pending"
        }
      });
      const pendingSum = pendingWithdrawals.reduce((sum, tx) => sum + tx.amount, 0);

      if (user.balance - pendingSum < amount) {
        return NextResponse.json({ success: false, message: "Insufficient balance (accounting for pending withdrawals)" }, { status: 400 });
      }

      if (!method || !proof) {
        return NextResponse.json({ success: false, message: "Withdrawal method and target address/details are required." }, { status: 400 });
      }

      await prisma.transaction.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          type: "withdrawal",
          amount,
          category,
          description: `Withdrawal via ${method}`,
          status: "pending",
          method,
          proof, // proof here represents the target payout details (address/tag)
        }
      });

      await prisma.notification.create({
        data: {
          userEmail: user.email,
          title: "Pending Approval",
          message: `Your withdrawal of $${amount.toLocaleString()} via ${method} is awaiting compliance officer review.`,
          type: "warning",
        }
      });

      // Audit Log
      await prisma.auditLog.create({
        data: {
          action: "WITHDRAWAL_SUBMITTED",
          details: `User ${user.email} submitted withdrawal request of $${amount} via ${method} to ${proof}.`,
        }
      });

      return NextResponse.json({ success: true, message: `Withdrawal request for $${amount.toLocaleString()} submitted.` });
    }

    return NextResponse.json({ success: false, message: "Invalid transaction type" }, { status: 400 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid input parameters" }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
