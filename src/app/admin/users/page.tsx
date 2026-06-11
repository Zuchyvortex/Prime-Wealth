"use client";

import React, { useState } from "react";
import { Search, ShieldAlert, ShieldCheck, Award, Coins, X, Check, AlertCircle } from "lucide-react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminUsersPage() {
  const { data: users, mutate } = useSWR("/api/admin/users", fetcher);

  const [searchTerm, setSearchTerm] = useState("");

  // Balance edit state
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editBalance, setEditBalance] = useState("");
  const [editSavings, setEditSavings] = useState("");
  const [editInvestments, setEditInvestments] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  // Filter users
  const filteredUsers = (users || []).filter((u: any) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const adminUpdateUserStatus = async (email: string, status: string) => {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", email, value: status })
    });
    mutate();
  };

  const adminUpdateUserTier = async (email: string, tier: string) => {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateTier", email, value: tier })
    });
    mutate();
  };

  const handleOpenBalanceModal = (user: any) => {
    setSelectedUser(user);
    setEditBalance(user.balance.toString());
    setEditSavings(user.savings?.toString() || "0");
    setEditInvestments(user.investments?.toString() || "0");
    setEditError("");
    setEditSuccess("");
    setBalanceModalOpen(true);
  };

  const handleSaveBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");

    if (!selectedUser) return;

    try {
      const res = await fetch("/api/admin/users/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          balance: parseFloat(editBalance),
          savings: parseFloat(editSavings),
          investments: parseFloat(editInvestments),
        })
      });

      const result = await res.json();
      if (res.ok) {
        setEditSuccess("User assets successfully adjusted.");
        mutate();
        setTimeout(() => {
          setBalanceModalOpen(false);
        }, 1500);
      } else {
        setEditError(result.error || "Failed to update balances.");
      }
    } catch (err) {
      setEditError("Server communication failed.");
    }
  };

  const getTierStyle = (tier: string) => {
    switch (tier) {
      case "elite":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "growth":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
          User Account Database
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Audit customer balances, verify compliance limits, and toggle account states.
        </p>
      </div>

      {/* SEARCH CONTROLS */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* USER DATABASE TABLE */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-[#090c16]">
                <th className="py-4.5 px-6">Profile</th>
                <th className="py-4.5 px-6">Joined Date</th>
                <th className="py-4.5 px-6">Wealth Tier</th>
                <th className="py-4.5 px-6">Liquid Balance</th>
                <th className="py-4.5 px-6">Savings</th>
                <th className="py-4.5 px-6">Investments</th>
                <th className="py-4.5 px-6">Status</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No accounts match search parameters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: any) => (
                  <tr key={u.email} className="hover:bg-white/1 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"} alt={u.name} className="w-9 h-9 rounded-xl border border-white/10" />
                        <div>
                          <p className="font-bold text-white leading-normal">{u.name}</p>
                          <span className="text-[9px] text-slate-550 block font-mono mt-0.5">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-450 font-mono">
                      {u.joinedDate}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getTierStyle(u.tier)}`}>
                        {u.tier}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-white font-extrabold font-mono">
                      {u.role === "admin" ? "System Ops" : formatCurrency(u.balance)}
                    </td>

                    <td className="py-4 px-6 text-slate-350 font-mono">
                      {u.role === "admin" ? "—" : formatCurrency(u.savings || 0)}
                    </td>

                    <td className="py-4 px-6 text-slate-350 font-mono">
                      {u.role === "admin" ? "—" : formatCurrency(u.investments || 0)}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border capitalize tracking-wide ${
                        u.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                          : "bg-red-500/10 text-red-400 border-red-500/10"
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {u.role === "admin" ? (
                        <span className="text-[10px] text-slate-500 font-mono">SYSTEM SAFE</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Adjust Assets */}
                          <button
                            onClick={() => handleOpenBalanceModal(u)}
                            className="p-1.5 rounded-lg border border-purple-500/10 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 transition-all cursor-pointer"
                            title="Adjust Assets Portfolio"
                          >
                            <Coins className="w-3.5 h-3.5" />
                          </button>

                          {/* Tier Adjustment */}
                          <select
                            value={u.tier}
                            onChange={(e) => adminUpdateUserTier(u.email, e.target.value)}
                            className="px-2 py-1 bg-[#090c16] border border-white/10 rounded-lg text-[9px] font-bold text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                          >
                            <option value="starter">Starter</option>
                            <option value="growth">Growth</option>
                            <option value="elite">Elite</option>
                          </select>

                          {/* Block/Unblock toggle */}
                          {u.status === "active" ? (
                            <button
                              onClick={() => adminUpdateUserStatus(u.email, "suspended")}
                              className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all cursor-pointer"
                              title="Freeze Account"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => adminUpdateUserStatus(u.email, "active")}
                              className="p-1.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 transition-all cursor-pointer"
                              title="Unfreeze Account"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BALANCE ADJUSTMENT OVERLAY MODAL */}
      <AnimatePresence>
        {balanceModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setBalanceModalOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#090c16] border border-white/10 rounded-2xl shadow-2xl p-6 z-10 space-y-4"
            >
              <button 
                onClick={() => setBalanceModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-extrabold text-white">Adjust Assets Portfolio</h3>
              <p className="text-xs text-slate-400">
                Editing asset parameters for <span className="font-bold text-white">{selectedUser.name}</span> ({selectedUser.email}).
              </p>

              {editError && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveBalances} className="space-y-4 font-sans text-xs">
                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold uppercase tracking-wider">
                    Liquid Cash ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold uppercase tracking-wider">
                    Savings Sub-Vault ($)
                  </label>
                  <input
                    type="number"
                    step="0.01;0"
                    min="0"
                    required
                    value={editSavings}
                    onChange={(e) => setEditSavings(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-400 font-bold uppercase tracking-wider">
                    Active Yield Investments ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editInvestments}
                    onChange={(e) => setEditInvestments(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#070913] border border-white/10 rounded-xl text-slate-400 focus:outline-none focus:border-purple-500 text-sm font-sans"
                    readOnly
                    title="Active yields should mature naturally or be cancelled dynamically"
                  />
                  <span className="text-[10px] text-slate-500 font-light mt-1 block">
                    Investments are locked until plan maturity. Liquid cash can be adjusted directly.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-purple-blue text-white rounded-xl text-sm font-semibold hover:brightness-110 active:scale-98 transition-all cursor-pointer font-sans"
                  >
                    Save Assets Configuration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
