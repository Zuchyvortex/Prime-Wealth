"use client";

import React, { useState } from "react";
import { 
  ArrowUpRight, ArrowDownLeft, Search, Filter, 
  ChevronLeft, ChevronRight, CircleDot 
} from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TransactionsPage() {
  const { data: currentUser } = useSWR("/api/user/profile", fetcher);
  
  const transactions = currentUser?.transactions || [];

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const userTransactions = transactions; // API already returns only this user's transactions

  // Apply filters
  const filteredTransactions = userTransactions.filter((tx: any) => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.targetEmail && tx.targetEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      categoryFilter === "all" || tx.category.toLowerCase() === categoryFilter.toLowerCase();
    
    const matchesStatus = 
      statusFilter === "all" || tx.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Transactions Ledger
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical records of your deposits, allocations, and compliance clearance wires.
        </p>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search memo, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#070913] border border-white/5 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="transfer">Transfer</option>
            <option value="investments">Investments</option>
            <option value="salary">Salary</option>
            <option value="utilities">Utilities</option>
            <option value="shopping">Shopping</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#070913] border border-white/5 rounded-xl text-xs text-slate-350 focus:outline-none focus:border-purple-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <CircleDot className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-white/1">
                <th className="py-4.5 px-6">Description</th>
                <th className="py-4.5 px-6">Category</th>
                <th className="py-4.5 px-6">Date</th>
                <th className="py-4.5 px-6">Status</th>
                <th className="py-4.5 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No transactions match your search/filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-white/1 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {tx.type === "deposit" || tx.type === "transfer_receive" ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <ArrowDownLeft className="w-4.5 h-4.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <ArrowUpRight className="w-4.5 h-4.5" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white leading-normal">{tx.description}</p>
                          {tx.targetEmail && (
                            <span className="text-[9px] text-slate-550 block font-mono mt-0.5">
                              {tx.type === "transfer_send" ? `To: ${tx.targetEmail}` : `From: ${tx.targetEmail}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-350 font-medium">
                      {tx.category}
                    </td>
                    <td className="py-4 px-6 text-slate-450 font-mono">
                      {new Date(tx.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border capitalize tracking-wide ${getStatusStyle(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className={`py-4 px-6 text-right font-extrabold ${
                      tx.type === "deposit" || tx.type === "transfer_receive"
                        ? "text-emerald-400"
                        : "text-purple-400"
                    }`}>
                      {tx.type === "deposit" || tx.type === "transfer_receive" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
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
