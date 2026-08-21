"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, X, Check } from "lucide-react";
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

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered with scope:", reg.scope);
        checkAndSubscribe(reg);
      })
      .catch((err) => {
        console.warn("Service Worker registration failed:", err);
      });
  }, [status, session]);

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
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.warn("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY for web push.");
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      // Send subscription to server
      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      });

      setShowPrompt(false);
    } catch (err) {
      console.warn("Failed to subscribe to push notifications:", err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleEnablePush = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await subscribeUser();
      } else {
        setShowPrompt(false);
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      setShowPrompt(false);
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
                Stay updated instantly on transaction clearances, deposit alerts, and support messages.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleEnablePush}
                  disabled={isSubscribing}
                  className="px-3.5 py-1.5 bg-gradient-neon text-[#022c22] rounded-lg text-xs font-bold hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isSubscribing ? "Enabling..." : "Enable"}
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
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
