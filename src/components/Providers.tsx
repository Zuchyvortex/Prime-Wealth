"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import PushNotificationManager from "@/components/PushNotificationManager";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <PushNotificationManager />
      </ThemeProvider>
    </SessionProvider>
  );
}
