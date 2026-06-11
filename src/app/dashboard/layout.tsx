"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  LayoutDashboard, Wallet, ArrowLeftRight, Settings, LogOut, 
  Menu, X, Bell, Search, ShieldCheck, CheckCircle2, AlertTriangle, Info,
  TrendingUp, LineChart, MessageSquare, BookOpen, User
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const { data: session } = useSession();
  const { data: currentUser, mutate } = useSWR("/api/user/profile", fetcher);
  
  const notifications = currentUser?.notifications || [];

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const menuItems = [
    { label: "Overview", icon: <LayoutDashboard className="w-5 h-5" />, href: "/dashboard" },
    { label: "Wallet & Cards", icon: <Wallet className="w-5 h-5" />, href: "/dashboard/wallet" },
    { label: "Yield Plans", icon: <TrendingUp className="w-5 h-5" />, href: "/dashboard/investments" },
    { label: "Market Preview", icon: <LineChart className="w-5 h-5" />, href: "/dashboard/market" },
    { label: "Transactions", icon: <ArrowLeftRight className="w-5 h-5" />, href: "/dashboard/transactions" },
    { label: "Support Chat", icon: <MessageSquare className="w-5 h-5" />, href: "/dashboard/support" },
    { label: "Guides", icon: <BookOpen className="w-5 h-5" />, href: "/dashboard/guide" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, href: "/dashboard/settings" },
  ];

  const avatarFallback = currentUser?.name?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const userNotifications = notifications;
  
  const unreadCount = userNotifications.filter((n: any) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "alert": return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <ProtectedRoute userOnly={true}>
      <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative transition-colors duration-300">
        {/* Background glow filters */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none" />

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-64 bg-background border-r border-[var(--glass-border)] sticky top-0 h-screen shrink-0 z-20">
          {/* Logo */}
          <div className="h-20 flex items-center gap-2.5 px-6 border-b border-[var(--glass-border)]">
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-purple-blue p-0.5">
              <div className="w-full h-full bg-background rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-purple-400" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Prime<span className="text-purple-400">Wealth</span>
            </span>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active 
                      ? "bg-gradient-purple-blue text-white shadow-md shadow-purple-500/10" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom logout info */}
          <div className="p-4 border-t border-[var(--glass-border)] space-y-4">
            <div className="flex items-center gap-3 px-2">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {avatarFallback}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">{currentUser?.name}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-purple-500/10 text-[9px] font-bold text-purple-400 border border-purple-500/10 uppercase tracking-widest">
                  {currentUser?.tier}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWER */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            
            {/* Drawer Content */}
            <div className="relative flex flex-col w-72 max-w-xs bg-background border-r border-[var(--glass-border)] h-full p-6">
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-8.5 h-8.5 rounded-lg bg-gradient-purple-blue p-0.5">
                  <div className="w-full h-full bg-background rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-purple-400" />
                  </div>
                </div>
                <span className="text-lg font-bold text-foreground">PrimeWealth</span>
              </div>

              <nav className="flex-1 space-y-1.5">
                {menuItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active 
                          ? "bg-gradient-purple-blue text-white shadow-lg" 
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-[var(--glass-border)] pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-sm shrink-0">{avatarFallback}</div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-foreground">{currentUser?.name}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-purple-500/10 text-[8px] font-bold text-purple-400 uppercase tracking-wider">{currentUser?.tier}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* HEADER HEADER */}
          <header className="h-20 glass-nav sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden text-slate-400 hover:text-white focus:outline-none"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="relative hidden sm:block w-64 md:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search assets, activities..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-3">

              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Notification Center Trigger */}
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="p-2 rounded-xl bg-white/5 border border-[var(--glass-border)] text-slate-400 hover:text-foreground transition-colors relative cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* NOTIFICATIONS DRAWER */}
                {notificationOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotificationOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-background border border-[var(--glass-border)] rounded-2xl shadow-2xl p-4 z-40 backdrop-blur-xl animate-[slideDown_0.2s_ease-out]">
                      <div className="flex justify-between items-center pb-3 border-b border-[var(--glass-border)]">
                        <h4 className="text-sm font-bold text-foreground">Notifications ({userNotifications.length})</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => { mutate(); }}
                            className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                        {userNotifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-6">No notifications found.</p>
                        ) : (
                          userNotifications.map((not: any) => (
                            <div
                              key={not.id}
                              onClick={() => { mutate(); }}
                              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                not.read 
                                  ? "bg-white/5 border-[var(--glass-border)] opacity-60" 
                                  : "bg-purple-500/5 border-purple-500/20"
                              }`}
                            >
                              <div className="flex gap-2.5">
                                <div className="mt-0.5">{getNotificationIcon(not.type)}</div>
                                <div className="flex-1">
                                  <h5 className="text-xs font-bold text-foreground flex justify-between items-center">
                                    {not.title}
                                    {!not.read && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />}
                                  </h5>
                                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">{not.message}</p>
                                  <span className="text-[8px] text-slate-500 font-mono mt-1.5 block">
                                    {new Date(not.date).toLocaleDateString()} {new Date(not.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User profile capsule */}
              <div className="flex items-center gap-2.5 border-l border-[var(--glass-border)] pl-3">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-purple-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-purple-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {avatarFallback}
                  </div>
                )}
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-foreground leading-none">{currentUser?.name}</p>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono block">{currentUser?.email}</span>
                </div>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
