import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Push Test API] Triggering test notification for: ${session.user.email}`);

    const result = await sendPushNotification({
      userEmail: session.user.email,
      title: "Prime Wealth Test",
      message: "Web Push notifications are working correctly on your device.",
      type: "success",
      url: "/dashboard",
    });

    return NextResponse.json({
      success: true,
      message: "Test push notification dispatched successfully.",
      details: result,
    });
  } catch (error: any) {
    console.error("[Push Test API] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send test push notification" }, { status: 500 });
  }
}
