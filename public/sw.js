self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installed successfully.");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activated successfully.");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[ServiceWorker] Push event received.");
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.warn("[ServiceWorker] Push event payload is not JSON, parsing as text:", e);
      data = { title: "Prime Wealth Alert", message: event.data.text() };
    }
  } else {
    data = { title: "Prime Wealth Notification", message: "You have a new update." };
  }

  const title = data.title || "Prime Wealth Notification";
  const options = {
    body: data.message || data.body || "New activity recorded in your account.",
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    data: {
      url: data.url || "/dashboard",
      type: data.type || "info",
    },
    vibrate: [200, 100, 200],
    tag: data.tag || data.url || "prime-wealth-notification",
    renotify: true,
    silent: false,
  };

  console.log("[ServiceWorker] Displaying notification:", title, options);
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log("[ServiceWorker] showNotification succeeded."))
      .catch((err) => console.error("[ServiceWorker] showNotification error:", err))
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[ServiceWorker] Notification clicked:", event.notification);
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          if (client.navigate) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
