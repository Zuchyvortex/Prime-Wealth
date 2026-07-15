import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { checkAndMatureInvestments } from "@/lib/maturity";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process matured investments dynamically on profile retrieve
    await checkAndMatureInvestments(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        cards: true,
        transactions: {
          orderBy: { date: 'desc' },
          take: 10
        },
        notifications: {
          orderBy: { date: 'desc' },
          take: 20
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Exclude password from the response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, job, currentPassword, newPassword, avatar } = body;

    // Password change flow
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedNewPassword },
      });

      return NextResponse.json({ message: "Password updated successfully." });
    }

    // Profile info update flow
    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (job !== undefined) updateData.job = job;
    if (avatar) {
      // Only allow Cloudinary URLs, data URIs, or other trusted domains
      if (!avatar.startsWith("https://") && !avatar.startsWith("data:image/")) {
        return NextResponse.json({ error: "Invalid avatar URL." }, { status: 400 });
      }
      updateData.avatar = avatar;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    const { password, ...userWithoutPassword } = updated;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

