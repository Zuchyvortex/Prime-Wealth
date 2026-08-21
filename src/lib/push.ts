import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@primewealth.com";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.warn("Failed to set VAPID details for web-push:", err);
  }
}

export interface PushNotificationOptions {
  userEmail: string | string[]; // Can be specific email, array of emails, or "admin"
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "alert";
  url?: string;
}

export async function sendPushNotification({
  userEmail,
  title,
  message,
  type = "info",
  url = "/dashboard",
}: PushNotificationOptions) {
  try {
    let targetEmails: string[] = [];

    if (userEmail === "admin") {
      const adminUsers = await prisma.user.findMany({
        where: { role: "admin" },
        select: { email: true },
      });
      targetEmails = adminUsers.map((u) => u.email);
    } else if (Array.isArray(userEmail)) {
      targetEmails = userEmail;
    } else if (typeof userEmail === "string" && userEmail.trim() !== "") {
      targetEmails = [userEmail];
    }

    if (targetEmails.length === 0) return;

    for (const email of targetEmails) {
      // 1. Create In-App Notification record
      try {
        await prisma.notification.create({
          data: {
            userEmail: email,
            title,
            message,
            type,
            link: url,
          } as any,
        });
      } catch (err) {
        console.warn(`Failed to create in-app notification for ${email}:`, err);
      }

      // 2. Send Web Push to registered subscriptions
      if (!vapidPublicKey || !vapidPrivateKey) continue;

      const subscriptions = await (prisma as any).pushSubscription.findMany({
        where: { userEmail: email },
      });

      if (subscriptions.length === 0) continue;

      const payload = JSON.stringify({
        title,
        message,
        body: message,
        url,
        type,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        timestamp: Date.now(),
      });

      for (const sub of (subscriptions as any[])) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };
          await webpush.sendNotification(pushSubscription, payload);
        } catch (error: any) {
          // If subscription has expired or is invalid (404, 410), clean it up
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log(`Removing expired push subscription for ${email}: ${sub.id}`);
            await (prisma as any).pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            console.warn(`Web push send error for ${email}:`, error);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in sendPushNotification service:", err);
  }
}
