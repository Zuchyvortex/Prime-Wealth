import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { sendPushNotification } from "@/lib/push";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let targetUserId = session.user.id;

    // Admin / Support Agent can request message history of any user
    if (session.user.role === "admin" || session.user.role === "support_agent") {
      const queryUserId = searchParams.get("userId");
      if (queryUserId) {
        targetUserId = queryUserId;
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    let targetUserId = session.user.id;
    let senderName = session.user.name || session.user.email || "User";
    const isAdminOrAgent = session.user.role === "admin" || session.user.role === "support_agent";

    // Allow agents to send replies on behalf of support to a specific user's room
    if (isAdminOrAgent) {
      const bodyUserId = body.userId;
      if (!bodyUserId) {
        return NextResponse.json({ error: "userId is required for support agents replies" }, { status: 400 });
      }
      targetUserId = bodyUserId;
      senderName = `Support: ${session.user.name || "Agent"}`;
    }

    const message = await prisma.chatMessage.create({
      data: {
        userId: targetUserId,
        content: content.trim(),
        sender: senderName
      }
    });

    // Send Web Push Notification
    if (isAdminOrAgent) {
      // Admin -> Client
      prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true } }).then((targetUser) => {
        if (targetUser?.email) {
          sendPushNotification({
            userEmail: targetUser.email,
            title: "New Support Message",
            message: "You have received a new message from Prime Wealth Support.",
            type: "info",
            url: "/dashboard/support",
          }).catch((e) => console.warn("Client chat push failed:", e));
        }
      });
    } else {
      // Client -> Admin
      sendPushNotification({
        userEmail: "admin",
        title: "New Customer Support Message",
        message: "A client has sent you a new support message.",
        type: "info",
        url: `/admin/chat?userId=${session.user.id}`,
      }).catch((e) => console.warn("Admin chat push failed:", e));
    }

    // Notify Pusher channel
    try {
      await pusherServer.trigger(`chat-${targetUserId}`, "new-message", message);
    } catch (e) {
      console.warn("Pusher server trigger failed, relying on SWR polling:", e);
    }

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
