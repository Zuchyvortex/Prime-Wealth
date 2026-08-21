import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@primewealth.com";

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    console.log("[WebPush Service] VAPID configuration initialized successfully.");
  } catch (err) {
    console.warn("[WebPush Service] Failed to set VAPID details:", err);
  }
} else {
  console.warn("[WebPush Service] Warning: Missing VAPID public or private key in environment.");
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
  const stats = {
    targetCount: 0,
    subscriptionsFound: 0,
    sentCount: 0,
    failedCount: 0,
    removedSubscriptions: 0,
  };

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

    stats.targetCount = targetEmails.length;
    console.log(`[Push Notification] Dispatched to ${targetEmails.length} recipient(s):`, targetEmails);

    if (targetEmails.length === 0) return stats;

    for (const rawEmail of targetEmails) {
      const email = rawEmail.toLowerCase().trim();

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
        console.log(`[In-App Notification] Created for ${email}: "${title}"`);
      } catch (err) {
        console.warn(`[In-App Notification] Failed to create record for ${email}:`, err);
      }

      // 2. Query Web Push subscriptions (case-insensitive)
      if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn("[WebPush Service] Skipping push send: VAPID keys not configured.");
        continue;
      }

      const subscriptions = await (prisma as any).pushSubscription.findMany({
        where: {
          OR: [
            { userEmail: { equals: email } },
            { userEmail: { equals: rawEmail } },
          ],
        },
      });

      stats.subscriptionsFound += subscriptions.length;
      console.log(`[Push Subscription] Found ${subscriptions.length} subscription(s) for ${email}`);

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

      const options = {
        vapidDetails: {
          subject: vapidSubject,
          publicKey: vapidPublicKey,
          privateKey: vapidPrivateKey,
        },
        headers: {
          Urgency: "high",
        },
        TTL: 86400,
      };

      for (const sub of (subscriptions as any[])) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, payload, options);
          stats.sentCount++;
          console.log(`[WebPush] Successfully delivered push to ${email} (Endpoint ID: ${sub.id})`);
        } catch (error: any) {
          stats.failedCount++;
          console.warn(`[WebPush] Delivery failed for ${email} (Endpoint ID: ${sub.id}) - Status: ${error.statusCode || error.message}`);

          // Clean up expired or invalid subscriptions (404 Not Found, 410 Gone)
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log(`[Push Subscription] Purging invalid/expired subscription for ${email}: ${sub.id}`);
            await (prisma as any).pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            stats.removedSubscriptions++;
          }
        }
      }
    }
  } catch (err) {
    console.error("[WebPush Service] Critical exception in sendPushNotification:", err);
  }

  return stats;
}
