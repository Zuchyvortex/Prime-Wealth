"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Scroll, Search, RefreshCw, ShieldAlert, ArrowLeftRight, Settings, TrendingUp } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminAuditLogsPage() {
  const { data: logs, error, mutate } = useSWR("/api/admin/logs", fetcher, {
    refreshInterval: 5000 // Refreshes every 5s
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs?.filter((log: any) => {
    const s = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.details.toLowerCase().includes(s) ||
      (log.adminId && log.adminId.toLowerCase().includes(s))
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "INVESTMENT_MATURED":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "INVESTMENT_STARTED":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "ADMIN_ADJUST_BALANCE":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "TRANSACTION_APPROVED":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "TRANSACTION_DECLINED":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-white/5 text-slate-400 border border-white/10";
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans flex items-center gap-2">
            <Scroll className="w-7 h-7 text-purple-400" />
            System Audit Trail Logs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable tracking ledger of all active client balance adjustments, maturity occurrences, and approvals.
          </p>
        </div>

        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-350 hover:bg-white/10 hover:text-white transition-all cursor-pointer font-sans"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Ledger
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter logs by action type, details, or admin ID..."
          className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-purple-500 text-xs font-sans"
        />
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#090c16] text-[10px] font-bold text-slate-450 uppercase tracking-widest font-sans">
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Action / Event</th>
                <th className="py-4 px-6">Operator Admin</th>
                <th className="py-4 px-6">System Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredLogs && filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                    No matching ledger items found.
                  </td>
                </tr>
              ) : (
                filteredLogs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/1">
                    <td className="py-4 px-6 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[9px] font-bold font-mono ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-[10px] text-slate-400">
                      {log.adminId ? `Admin ID: ${log.adminId.substring(0, 8)}...` : "SYSTEM_ENGINE"}
                    </td>
                    <td className="py-4 px-6 text-slate-300 leading-relaxed max-w-md">
                      {log.details}
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
