"use client";

import React, { useState } from "react";
import { 
  ArrowUpRight, ArrowDownLeft, Check, X, 
  Hourglass, AlertCircle, RefreshCw 
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminTransactionsPage() {
  const { data: transactions, mutate } = useSWR("/api/admin/transactions", fetcher);
  
  const [filterMode, setFilterMode] = useState<"all" | "pending">("all");

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
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        );
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/10";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/10";
      default:
        return "bg-red-500/10 text-red-400 border-red-500/10";
    }
  };

  const displayedTransactions = (transactions || []).filter((tx: any) => {
    if (filterMode === "pending") return tx.status === "pending";
    return true;
  });

  const adminProcessTransaction = async (id: string, action: string) => {
    await fetch("/api/admin/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    mutate();
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Global Master Ledger
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time visual audit logs and risk-clearance controls.
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === "all" 
                ? "bg-gradient-purple-blue text-white" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilterMode("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === "pending" 
                ? "bg-gradient-purple-blue text-white" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Awaiting Clearance
            {displayedTransactions.filter((t: any) => t.status === "pending").length > 0 && (
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* MASTER LEDGER TABLE */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-white/1">
                <th className="py-4.5 px-6">User Account</th>
                <th className="py-4.5 px-6">Details / Memo</th>
                <th className="py-4.5 px-6">Date</th>
                <th className="py-4.5 px-6">Status</th>
                <th className="py-4.5 px-6 text-right">Amount</th>
                <th className="py-4.5 px-6 text-right">Clearance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {displayedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No transactions match filter settings.
                  </td>
                </tr>
              ) : (
                displayedTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-white/1 transition-colors">
                    
                    {/* User profile details */}
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-white leading-normal">{tx.userName}</p>
                        <span className="text-[9px] text-slate-500 block font-mono mt-0.5">{tx.userEmail}</span>
                      </div>
                    </td>

                    {/* Transaction details */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {getTransactionBadge(tx.type)}
                        <div>
                          <p className="font-bold text-white leading-normal">{tx.description}</p>
                          <span className="text-[9px] text-slate-500 block font-mono mt-0.5 uppercase tracking-wide">
                            {tx.type} • {tx.category} {tx.method ? `• ${tx.method}` : ''}
                          </span>
                          {tx.proof && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="text-[9px] font-bold text-slate-400">TXID/REF:</span>
                              <span className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-300 max-w-[150px] truncate" title={tx.proof}>
                                {tx.proof}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-slate-450 font-mono">
                      {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border capitalize tracking-wide ${getStatusStyle(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className={`py-4 px-6 text-right font-extrabold font-mono ${
                      tx.type === "deposit" || tx.type === "transfer_receive"
                        ? "text-emerald-400"
                        : "text-purple-400"
                    }`}>
                      {tx.type === "deposit" || tx.type === "transfer_receive" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </td>

                    {/* Clearance Actions */}
                    <td className="py-4 px-6 text-right">
                      {tx.status === "pending" ? (
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => adminProcessTransaction(tx.id, "decline")}
                            className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all cursor-pointer flex items-center justify-center"
                            title="Decline / Return Funds"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => adminProcessTransaction(tx.id, "approve")}
                            className="p-1.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 transition-all cursor-pointer flex items-center justify-center"
                            title="Approve / Settle Transfer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">SETTLED</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
