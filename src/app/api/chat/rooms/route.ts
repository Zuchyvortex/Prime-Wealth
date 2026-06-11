import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "support_agent")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all users who have sent support messages
    const usersWithChats = await prisma.user.findMany({
      where: {
        chatMessages: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        chatMessages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    // Format room representations
    const rooms = usersWithChats.map(u => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      lastMessage: u.chatMessages[0]?.content || "",
      lastMessageAt: u.chatMessages[0]?.createdAt || null
    })).sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    return NextResponse.json(rooms);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
