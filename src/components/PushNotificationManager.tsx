"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, X, Check, Send, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const { data: session, status } = useSession();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [permissionState, setPermissionState] = useState<string>("default");

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[PushNotificationManager] Web Push is not supported on this browser.");
      return;
    }

    if (typeof Notification !== "undefined") {
      setPermissionState(Notification.permission);
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[PushNotificationManager] Service Worker registered with scope:", reg.scope);
        checkAndSubscribe(reg);
      })
      .catch((err) => {
        console.warn("[PushNotificationManager] Service Worker registration failed:", err);
      });
  }, [status, session]);

  const fetchVapidKey = async (): Promise<string | null> => {
    const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (envKey && envKey.trim() !== "") return envKey.trim();

    try {
      const res = await fetch("/api/push/vapid-key");
      const data = await res.json();
      if (res.ok && data.publicKey) {
        return data.publicKey;
      }
    } catch (err) {
      console.error("[PushNotificationManager] Failed to fetch VAPID key from API:", err);
    }
    return null;
  };

  const checkAndSubscribe = async (reg: ServiceWorkerRegistration) => {
    if (typeof Notification === "undefined") return;

    if (Notification.permission === "granted") {
      subscribeUser(reg);
    } else if (Notification.permission === "default") {
      const promptDismissed = sessionStorage.getItem("push_prompt_dismissed");
      if (!promptDismissed) {
        setShowPrompt(true);
      }
    }
  };

  const subscribeUser = async (registration?: ServiceWorkerRegistration) => {
    try {
      setIsSubscribing(true);
      const reg = registration || (await navigator.serviceWorker.ready);

      const vapidPublicKey = await fetchVapidKey();

      if (!vapidPublicKey) {
        console.warn("[PushNotificationManager] Missing VAPID public key. Cannot subscribe.");
        return;
      }

      console.log("[PushNotificationManager] Using VAPID public key for subscription.");
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        console.log("[PushNotificationManager] Creating new PushSubscription...");
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      } else {
        console.log("[PushNotificationManager] Existing PushSubscription found.");
      }

      // Sync subscription to backend
      const subJson = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      if (res.ok) {
        console.log("[PushNotificationManager] Push subscription synced to database.");
        setShowPrompt(false);
      } else {
        const errData = await res.json();
        console.warn("[PushNotificationManager] Failed to sync subscription to backend:", errData);
      }
    } catch (err) {
      console.error("[PushNotificationManager] Error subscribing to push notifications:", err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleEnablePush = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);
      if (permission === "granted") {
        await subscribeUser();
      } else {
        setShowPrompt(false);
      }
    } catch (err) {
      console.error("[PushNotificationManager] Permission request error:", err);
      setShowPrompt(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      setIsSendingTest(true);
      setTestResult(null);

      // Ensure browser is subscribed first
      await subscribeUser();

      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: "Test notification sent to your device!" });
      } else {
        setTestResult({ success: false, message: data.error || "Failed to send test notification." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Network error" });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleDismissPrompt = () => {
    sessionStorage.setItem("push_prompt_dismissed", "true");
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-[#0b0f19] border border-blue-500/30 rounded-2xl shadow-2xl p-4 text-white font-sans backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-white">Enable Push Notifications</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Stay updated instantly on transaction clearances, deposit alerts, and support messages even when the tab is closed.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleEnablePush}
                  disabled={isSubscribing}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-lg text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSubscribing ? "Enabling..." : "Enable Push"}
                </button>
                <button
                  onClick={handleDismissPrompt}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismissPrompt}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
