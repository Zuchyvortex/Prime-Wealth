"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  TrendingUp, Wallet, Coins, ArrowUpRight, ArrowDownLeft, 
  Calendar, CreditCard, ChevronRight, HelpCircle, Activity,
  ShieldCheck, ShieldAlert, Clock, Info
} from "lucide-react";
import useSWR from "swr";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from "recharts";

// Mock data for charts
const CHART_DATA = {
  "1W": [
    { name: "Mon", value: 118000 },
    { name: "Tue", value: 119500 },
    { name: "Wed", value: 120200 },
    { name: "Thu", value: 122000 },
    { name: "Fri", value: 121500 },
    { name: "Sat", value: 123800 },
    { name: "Sun", value: 124500.80 },
  ],
  "1M": [
    { name: "W1", value: 112000 },
    { name: "W2", value: 115800 },
    { name: "W3", value: 119000 },
    { name: "W4", value: 124500.80 },
  ],
  "1Y": [
    { name: "Jan", value: 85000 },
    { name: "Feb", value: 92000 },
    { name: "Mar", value: 98500 },
    { name: "Apr", value: 110000 },
    { name: "May", value: 124500.80 },
  ]
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserDashboardHome() {
  const { data: currentUser, error } = useSWR("/api/user/profile", fetcher);
  const [timeframe, setTimeframe] = useState<"1W" | "1M" | "1Y">("1W");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const transactions = currentUser?.transactions || [];
  const recentTransactions = transactions.slice(0, 3);

  // Format currency helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "deposit":
      case "transfer_receive":
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        );
    }
  };

  const userStatus = currentUser?.status || "UNVERIFIED";
  const verificationStatus = currentUser?.verification?.verificationStatus || "Not Submitted";
  const rejectionReason = currentUser?.verification?.rejectionReason;

  return (
    <div className="space-y-8">
      {/* WELCOME BANNER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Wealth Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your capital, digital assets, and current yields.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 bg-white/5 border border-white/5 rounded-xl text-slate-350">
          <Calendar className="w-4 h-4 text-brand-emerald" />
          <span>Last sync: Just now</span>
        </div>
      </div>

      {/* KYC NOTIFICATION BANNER */}
      {userStatus !== "VERIFIED" && (
        <div className="glass rounded-2xl p-5 border border-[var(--glass-border)] relative overflow-hidden transition-all duration-300">
          {verificationStatus === "Pending Review" ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/15 rounded-xl text-yellow-400">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Identity Verification Pending Review</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Thank you for submitting your identity verification. Our compliance team is currently reviewing your documents.
                  </p>
                </div>
              </div>
              <Link 
                href="/dashboard/verification"
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition-all whitespace-nowrap"
              >
                View Submission
              </Link>
            </div>
          ) : verificationStatus === "Rejected" || userStatus === "REJECTED" ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-xl text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">Verification Rejected: Attention Required</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Reason: <span className="text-red-400 font-semibold">{rejectionReason || "Documents could not be verified."}</span>. Please update and resubmit your KYC details.
                  </p>
                </div>
              </div>
              <Link 
                href="/dashboard/verification"
                className="px-4 py-2 bg-gradient-neon text-[#022c22] text-xs font-bold rounded-xl hover:brightness-110 transition-all whitespace-nowrap"
              >
                Resubmit KYC
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-brand-emerald/10 border border-brand-emerald/15 rounded-xl text-brand-emerald">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Verify Your Identity (KYC Required)</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Your account is currently Unverified. Please complete your identity verification to unlock premium investment allocations.
                  </p>
                </div>
              </div>
              <Link 
                href="/dashboard/verification"
                className="px-4 py-2 bg-gradient-neon text-[#022c22] text-xs font-bold rounded-xl hover:brightness-110 transition-all whitespace-nowrap shadow-md shadow-brand-emerald/10"
              >
                Verify Identity
              </Link>
            </div>
          )}
        </div>
      )}

      {/* QUICK BALANCE CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Vault Balance */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass-premium rounded-2xl p-6 relative overflow-hidden"
        >
          {/* Decorative backdrop gradients */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-emerald/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Vault</span>
            <div className="p-2 bg-brand-emerald/10 border border-brand-emerald/15 rounded-xl text-brand-emerald">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>

          <h3 className="text-3xl font-extrabold tracking-tight text-white">
            {formatCurrency(currentUser?.balance || 0)}
          </h3>
          
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-3 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+4.2% APY Yielding</span>
          </div>
        </motion.div>

        {/* Card 2: Savings sub-vault */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liquidity Reserves</span>
            <div className="p-2 bg-blue-500/10 border border-blue-500/15 rounded-xl text-blue-400">
              <Coins className="w-4.5 h-4.5" />
            </div>
          </div>

          <h3 className="text-3xl font-extrabold tracking-tight text-white">
            {formatCurrency(currentUser?.savings || 0)}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-450 mt-3">
            <span>Dynamic interest: Standard</span>
          </div>
        </motion.div>

        {/* Card 3: Investments */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="glass rounded-2xl p-6 relative overflow-hidden sm:col-span-2 lg:col-span-1"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Portfolio Allocations</span>
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-indigo-400">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>

          <h3 className="text-3xl font-extrabold tracking-tight text-white">
            {formatCurrency(currentUser?.investments || 0)}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-3 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+8.9% growth this quarter</span>
          </div>
        </motion.div>
      </div>

      {/* CHART & DETAILS FLEX ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Wealth growth area chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h4 className="text-base font-bold text-white">Asset Performance</h4>
              <p className="text-xs text-slate-500">Historical performance timeline of total net assets.</p>
            </div>
            
            {/* Timeframe selector tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              {(["1W", "1M", "1Y"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeframe === t 
                      ? "bg-gradient-neon text-[#022c22] shadow" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={CHART_DATA[timeframe]}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#090c16",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }}
                    formatter={(v: any) => [formatCurrency(Number(v || 0)), "Balance"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorVal)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                Initializing charts...
              </div>
            )}
          </div>
        </div>

        {/* Right activities & links */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-base font-bold text-white">Recent Activities</h4>
              <Link 
                href="/dashboard/transactions" 
                className="text-xs text-brand-emerald hover:text-brand-neon-green font-semibold flex items-center transition-all"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No transactions found.</p>
              ) : (
                recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex justify-between items-center p-3.5 bg-white/3 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      {getTransactionBadge(tx.type)}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{tx.description}</p>
                        <span className="text-[10px] text-slate-500 block font-mono mt-0.5 uppercase tracking-wide">
                          {tx.category} • {tx.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${
                        tx.type === "deposit" || tx.type === "transfer_receive"
                          ? "text-emerald-400"
                          : "text-brand-emerald"
                      }`}>
                        {tx.type === "deposit" || tx.type === "transfer_receive" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                      <span className="text-[8px] text-slate-550 block font-mono mt-0.5">
                        {new Date(tx.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick wallet call to action card */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-brand-emerald/10 to-blue-500/10 border border-brand-emerald/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-brand-emerald" />
              <div>
                <h5 className="text-xs font-bold text-white">Transfer Funds</h5>
                <p className="text-[10px] text-slate-400 mt-0.5">Execute immediate vault wiring.</p>
              </div>
            </div>
            <Link 
              href="/dashboard/wallet"
              className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
