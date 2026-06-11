"use client";

import React, { useState, useEffect } from "react";

import { 
  Users, Landmark, ArrowLeftRight, Hourglass, 
  TrendingUp, Activity, Cpu, RefreshCw 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminOverviewPage() {
  const { data: usersData } = useSWR("/api/admin/users", fetcher);
  const { data: transactionsData } = useSWR("/api/admin/transactions", fetcher);
  
  const users = usersData || [];
  const transactions = transactionsData || [];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Aggregate stats
  const totalUsers = users.length;
  
  const totalValueLocked = users.reduce((acc: number, user: any) => {
    return acc + user.balance + user.savings + user.investments;
  }, 0);

  const completedTx = transactions.filter((t: any) => t.status === "completed");
  
  const totalTxVolume = completedTx.reduce((acc: number, tx: any) => {
    return acc + tx.amount;
  }, 0);

  const pendingTxCount = transactions.filter((t: any) => t.status === "pending").length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Process transaction volume categories for chart
  const categories = ["Salary", "Investments", "Utilities", "Transfer", "Shopping"];
  const chartData = categories.map(cat => {
    const inbound = completedTx
      .filter((t: any) => t.category.toLowerCase() === cat.toLowerCase() && (t.type === "deposit" || t.type === "transfer_receive"))
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const outbound = completedTx
      .filter((t: any) => t.category.toLowerCase() === cat.toLowerCase() && (t.type === "withdrawal" || t.type === "transfer_send"))
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return {
      name: cat,
      Deposits: inbound,
      Withdrawals: outbound
    };
  });

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            System Operations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global monitoring console, user counts, and ledger audits.
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-350 hover:bg-white/10 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
          Refresh Systems
        </button>
      </div>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat 1: Total Users */}
        <div className="glass rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Accounts</span>
            <Users className="w-4.5 h-4.5 text-purple-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">{totalUsers}</h3>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">KYC Clearance: 100%</p>
        </div>

        {/* Stat 2: Total TVL */}
        <div className="glass rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value Locked (TVL)</span>
            <Landmark className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">{formatCurrency(totalValueLocked)}</h3>
          <p className="text-[10px] text-emerald-400 mt-2 font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +12.4% this week
          </p>
        </div>

        {/* Stat 3: Total Volume */}
        <div className="glass rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ledger Clear Volume</span>
            <ArrowLeftRight className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">{formatCurrency(totalTxVolume)}</h3>
          <p className="text-[10px] text-slate-500 mt-2 font-mono">Settlements processed: {completedTx.length}</p>
        </div>

        {/* Stat 4: Pending Compliance */}
        <div className="glass-premium rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Compliance Queue</span>
            <Hourglass className="w-4.5 h-4.5 text-yellow-400" />
          </div>
          <h3 className="text-3xl font-extrabold text-white">{pendingTxCount}</h3>
          <p className="text-[10px] text-yellow-400 mt-2 font-mono">
            {pendingTxCount > 0 ? "Awaiting clearance review" : "Ledger fully settled"}
          </p>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Ledger Category Flow Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h4 className="text-sm font-bold text-white mb-6">Financial Ledger Flow by Category</h4>
          
          <div className="h-80 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
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
                    formatter={(v: any) => [formatCurrency(Number(v || 0)), ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  <Bar dataKey="Deposits" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Withdrawals" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                Loading charts...
              </div>
            )}
          </div>
        </div>

        {/* Server & Node Status Logs */}
        <div className="glass rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-white mb-5">Security Node Health</h4>
            
            <div className="space-y-4">
              <div className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Database Core Sync</h5>
                    <p className="text-[9px] text-slate-500">Latency: 2ms</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-400 rounded uppercase">online</span>
              </div>

              <div className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">API Server Load</h5>
                    <p className="text-[9px] text-slate-500">Memory: 14%</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-400 rounded uppercase">normal</span>
              </div>

              <div className="p-3 bg-white/3 border border-white/5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Federal API Node</h5>
                    <p className="text-[9px] text-slate-500">Connection: Active</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-500/10 text-emerald-400 rounded uppercase">stable</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[#070913] border border-white/5 rounded-xl">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">compliance audit info</span>
            <p className="text-[10px] text-slate-400 leading-normal font-light">
              Pending wires are locked via secondary smart compliance scripts. Clearances require administrative review on the ledger log.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
