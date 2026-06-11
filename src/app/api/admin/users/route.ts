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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance: true,
        savings: true,
        investments: true,
        status: true,
        tier: true,
        avatar: true,
        joinedDate: true,
      }
    });

    // Serialize DateTime objects to locale strings for the frontend
    const serialized = users.map(u => ({
      ...u,
      joinedDate: u.joinedDate ? new Date(u.joinedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"
    }));

    return NextResponse.json(serialized);
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
    const { action, email, value } = body; 
    // action: "updateStatus" | "updateTier"
    // value: "active"|"suspended" or "starter"|"growth"|"elite"

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "updateStatus") {
      await prisma.user.update({
        where: { email: user.email },
        data: { status: value }
      });

      await prisma.notification.create({
        data: {
          userEmail: user.email,
          title: value === "suspended" ? "Account Suspended" : "Account Re-activated",
          message: value === "suspended"
            ? "Compliance has temporarily frozen your transactions. Please reach out to verify account details."
            : "Compliance has completed reviews. Full dashboard activities restored.",
          type: value === "suspended" ? "alert" : "success",
        }
      });
      return NextResponse.json({ success: true, message: `User status updated to ${value}` });
    }

    if (action === "updateTier") {
      await prisma.user.update({
        where: { email: user.email },
        data: { tier: value }
      });

      await prisma.notification.create({
        data: {
          userEmail: user.email,
          title: "Wealth Tier Upgraded",
          message: `Congratulations! Your profile has been promoted to the ${value.toUpperCase()} Wealth tier.`,
          type: "success",
        }
      });
      return NextResponse.json({ success: true, message: `User tier updated to ${value}` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
