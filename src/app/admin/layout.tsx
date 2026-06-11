"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import useSWR from "swr";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { 
  BarChart3, Users, Landmark, LogOut, Menu, X, 
  ShieldCheck, Search, Bell, Settings, MessageSquare, Scroll 
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const { data: session } = useSession();
  const { data: currentUser } = useSWR("/api/user/profile", fetcher);
  const { data: transactions } = useSWR("/api/admin/transactions", fetcher);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const adminMenuItems = [
    { label: "Overview", icon: <BarChart3 className="w-5 h-5" />, href: "/admin" },
    { label: "User Accounts", icon: <Users className="w-5 h-5" />, href: "/admin/users" },
    { label: "Financial Ledger", icon: <Landmark className="w-5 h-5" />, href: "/admin/transactions" },
    { label: "Support Chats", icon: <MessageSquare className="w-5 h-5" />, href: "/admin/chat" },
    { label: "System Audit Logs", icon: <Scroll className="w-5 h-5" />, href: "/admin/logs" },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const pendingCount = (transactions || []).filter((t: any) => t.status === "pending").length;

  return (
    <ProtectedRoute adminOnly={true}>
      <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col md:flex-row relative">
        {/* Background glow filters */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900/5 rounded-full blur-3xl pointer-events-none" />

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-64 bg-[#090c16] border-r border-white/5 sticky top-0 h-screen shrink-0 z-20">
          {/* Logo */}
          <div className="h-20 flex items-center gap-2.5 px-6 border-b border-white/5">
            <div className="w-8.5 h-8.5 rounded-lg bg-gradient-purple-blue p-0.5">
              <div className="w-full h-full bg-[#070913] rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-purple-400" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Prime<span className="text-purple-400">Admin</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {adminMenuItems.map((item) => {
              const active = pathname === item.href;
              const isLedger = item.label === "Financial Ledger";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active 
                      ? "bg-gradient-purple-blue text-white shadow-md shadow-purple-500/10" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {isLedger && pendingCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-500 text-black rounded-md">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user capsule */}
          <div className="p-4 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-red-500/10 text-[8px] font-bold text-red-400 border border-red-500/10 uppercase tracking-widest">
                  System Admin
                </span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-450 hover:bg-red-950/20 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAWER */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
            
            <div className="relative flex flex-col w-72 max-w-xs bg-[#090c16] border-r border-white/10 h-full p-6">
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-8.5 h-8.5 rounded-lg bg-gradient-purple-blue p-0.5">
                  <div className="w-full h-full bg-[#070913] rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-purple-400" />
                  </div>
                </div>
                <span className="text-lg font-bold text-white">PrimeAdmin</span>
              </div>

              <nav className="flex-1 space-y-1.5">
                {adminMenuItems.map((item) => {
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

              <div className="border-t border-white/5 pt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <img src={currentUser?.avatar} alt={currentUser?.name} className="w-10 h-10 rounded-xl border border-white/10" />
                  <div>
                    <p className="text-xs font-bold text-white">{currentUser?.name}</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-red-500/10 text-[8px] font-bold text-red-400 uppercase tracking-widest">Admin</span>
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
          <header className="h-20 bg-[#070913]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
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
                  placeholder="Audit accounts, transactions..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors relative cursor-pointer">
                  <Bell className="w-5 h-5" />
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-yellow-500 rounded-full text-[9px] font-bold text-black flex items-center justify-center border border-[#070913]">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2.5 border-l border-white/10 pl-4">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-9 h-9 rounded-xl object-cover border border-white/10"
                />
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none">Ops Console</p>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono block">Sarah Jenkins</span>
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
