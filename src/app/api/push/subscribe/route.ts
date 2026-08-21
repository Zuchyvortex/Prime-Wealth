import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      console.warn("[Push Subscribe API] Unauthorized request attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      console.warn("[Push Subscribe API] Invalid subscription parameters received.");
      return NextResponse.json({ error: "Invalid subscription details" }, { status: 400 });
    }

    const normalizedEmail = session.user.email.toLowerCase().trim();

    const subscriptionRecord = await (prisma as any).pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        userEmail: normalizedEmail,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId: session.user.id,
        userEmail: normalizedEmail,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    console.log(`[Push Subscribe API] Successfully registered subscription for User ${normalizedEmail} (${session.user.id}) | ID: ${subscriptionRecord.id}`);

    return NextResponse.json({
      success: true,
      message: "Push subscription registered successfully",
      subscriptionId: subscriptionRecord.id,
    });
  } catch (error: any) {
    console.error("[Push Subscribe API] Exception during subscription registration:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
