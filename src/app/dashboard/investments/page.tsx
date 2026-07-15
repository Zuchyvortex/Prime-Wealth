"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Calendar, DollarSign, Award, 
  ArrowUpRight, AlertCircle, CheckCircle2, ShieldCheck, Hourglass 
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

import { INVESTMENT_PLANS as PLANS } from "@/lib/config";

export default function InvestmentsPage() {
  const { data: currentUser, mutate: mutateUser } = useSWR("/api/user/profile", fetcher);
  const { data: investments, mutate: mutateInvestments } = useSWR("/api/investments", fetcher);

  const [selectedPlan, setSelectedPlan] = useState("Starter");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const activePlan = PLANS.find(p => p.id === selectedPlan) || PLANS[0];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const getProgress = (startDateStr: string, durationDays: number) => {
    const start = new Date(startDateStr).getTime();
    const now = Date.now();
    const durationMs = durationDays * 24 * 60 * 60 * 1000;
    const elapsed = now - start;
    if (elapsed >= durationMs) return 100;
    if (elapsed <= 0) return 0;
    return parseFloat(((elapsed / durationMs) * 100).toFixed(1));
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Please enter a valid amount.");
      return;
    }

    if (amountNum < activePlan.min) {
      setErrorMsg(`Minimum allocation for this plan is $${activePlan.min.toLocaleString()}.`);
      return;
    }

    if (!currentUser || currentUser.balance < amountNum) {
      setErrorMsg("Insufficient liquid vault balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, amount: amountNum })
      });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg(`Yield plan purchased! Expected returns: ${formatCurrency(amountNum * (activePlan.roi / 100))}.`);
        setAmount("");
        mutateUser();
        mutateInvestments();
      } else {
        setErrorMsg(result.message || "Failed to process purchase.");
      }
    } catch (err) {
      setErrorMsg("Server error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
          Yield Plans & Investments
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Allocate your capital into high-performing yield nodes and track maturity periods.
        </p>
      </div>

      {/* DASHBOARD STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Liquid Vault Cash</p>
          <h3 className="text-2xl font-extrabold text-white mt-1">
            {formatCurrency(currentUser?.balance || 0)}
          </h3>
          <span className="text-[9px] text-slate-550 mt-1 block font-mono">Available for immediate yield allocation</span>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Locked Yield Assets</p>
          <h3 className="text-2xl font-extrabold text-brand-emerald mt-1">
            {formatCurrency(currentUser?.investments || 0)}
          </h3>
          <span className="text-[9px] text-slate-550 mt-1 block font-mono">Actively gathering interest</span>
        </div>
        <div className="glass rounded-2xl p-6 border border-white/5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expected Maturity Payouts</p>
          <h3 className="text-2xl font-extrabold text-emerald-405 mt-1">
            {formatCurrency(
              investments
                ?.filter((inv: any) => inv.status === "active")
                .reduce((acc: number, inv: any) => acc + inv.amount + inv.profit, 0) || 0
            )}
          </h3>
          <span className="text-[9px] text-slate-550 mt-1 block font-mono">Principal + profit totals</span>
        </div>
      </div>

      {/* DETAILED LAYOUT FOR INVESTING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PURCHASE WIDGET */}
        <div className="lg:col-span-7 space-y-6">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Available Yield Contracts
          </h4>

          <div className="space-y-4">
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all hover:bg-white/5 relative overflow-hidden ${
                  selectedPlan === plan.id 
                    ? `bg-gradient-to-r ${plan.color}` 
                    : "bg-white/2 border-white/5"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${plan.badgeColor}`}>
                      {plan.roi}% ROI Yield
                    </span>
                    <h5 className="text-base font-extrabold text-white mt-2.5">{plan.name}</h5>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-md">{plan.desc}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-white font-mono block">Duration: {plan.duration} Days</span>
                    <span className="text-[10px] text-slate-500 mt-1 block font-mono">Min: {formatCurrency(plan.min)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handlePurchase} className="glass rounded-2xl p-6 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-bold text-white">Allocate Capital to {activePlan.name}</h5>
              <span className="text-xs text-brand-emerald font-bold font-mono">Yield Factor: {activePlan.roi}%</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-250 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Investment Capital (USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="number"
                  required
                  min={activePlan.min}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min allocation: ${activePlan.min}`}
                  className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald text-sm font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || currentUser?.status === "suspended"}
              className="w-full py-3 bg-gradient-neon text-[#022c22] rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer font-sans"
            >
              {isSubmitting ? "Locking Funds..." : "Confirm Ledger Allocation"}
            </button>
          </form>
        </div>

        {/* ACTIVE INVESTMENTS TRACKER */}
        <div className="lg:col-span-5 space-y-6">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Active Yield Contracts ({investments?.filter((i: any) => i.status === "active").length || 0})
          </h4>

          <div className="space-y-4">
            {investments && investments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl glass text-slate-500 text-xs">
                No active yield contracts. Purchase one to begin accumulating interest.
              </div>
            ) : (
              investments?.map((inv: any) => {
                const progress = getProgress(inv.startDate, inv.duration);
                const isMature = inv.status === "matured";

                return (
                  <div key={inv.id} className="glass rounded-xl p-5 border border-white/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h6 className="text-sm font-bold text-white">{inv.plan} Yield Plan</h6>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          Purchased: {new Date(inv.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono ${
                        isMature 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                      <div>
                        <p className="text-slate-550 text-[10px]">Capital Locked</p>
                        <p className="font-bold text-white">{formatCurrency(inv.amount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-550 text-[10px]">Accruing Profit</p>
                        <p className="font-bold text-emerald-400">+{formatCurrency(inv.profit)}</p>
                      </div>
                    </div>

                    {!isMature && (
                      <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                        <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Hourglass className="w-3 h-3 text-amber-500" />
                            {progress}% Mature
                          </span>
                          <span>Payout: {new Date(inv.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-brand-emerald to-indigo-500 h-full rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
