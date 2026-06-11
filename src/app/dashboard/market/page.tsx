"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, ArrowUpRight, DollarSign, 
  ArrowRightLeft, AlertCircle, CheckCircle2, RefreshCw 
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MarketRatesPage() {
  const { data: currentUser, mutate: mutateUser } = useSWR("/api/user/profile", fetcher);
  const { data: marketData, error, mutate: mutateMarket } = useSWR("/api/market", fetcher, {
    refreshInterval: 4000,
    fallbackData: {
      btc: { name: "Bitcoin", symbol: "BTC", price: 92450.00, change: 2.45, sparkline: [91200, 91500, 91100, 92000, 92450, 92800] },
      eth: { name: "Ethereum", symbol: "ETH", price: 3480.20, change: -1.15, sparkline: [3550, 3520, 3490, 3460, 3480, 3440] },
      tsla: { name: "Tesla Inc.", symbol: "TSLA", price: 178.45, change: 0.85, sparkline: [175, 176, 177, 178.5, 178.45, 179.20] },
      aapl: { name: "Apple Inc.", symbol: "AAPL", price: 182.30, change: 1.22, sparkline: [180, 181, 180.5, 181.8, 182.30, 183.10] }
    }
  });

  const [activeAssetKey, setActiveAssetKey] = useState("btc");
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeType, setTradeType] = useState("buy");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");

  const activeAsset = marketData[activeAssetKey] || marketData.btc;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const renderSparkline = (pointsData: number[], positive: boolean) => {
    if (!pointsData || pointsData.length === 0) return null;
    const min = Math.min(...pointsData);
    const max = Math.max(...pointsData);
    const range = max - min === 0 ? 1 : max - min;
    const width = 120;
    const height = 40;
    const points = pointsData
      .map((val, index) => {
        const x = (index / (pointsData.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={positive ? "#10b981" : "#ef4444"}
          strokeWidth="2"
          points={points}
        />
      </svg>
    );
  };

  const handleSimulateSwap = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError("");
    setFeedbackSuccess("");

    const amountNum = parseFloat(tradeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFeedbackError("Please enter a valid amount.");
      return;
    }

    if (tradeType === "buy") {
      if (!currentUser || currentUser.balance < amountNum) {
        setFeedbackError("Insufficient liquid balance to fulfill swap.");
        return;
      }

      const receivedUnits = (amountNum / activeAsset.price).toFixed(6);
      setFeedbackSuccess(
        `Simulation Successful: Exchanged ${formatCurrency(amountNum)} for ${receivedUnits} ${activeAsset.symbol}.`
      );
    } else {
      const units = amountNum;
      const totalUSD = units * activeAsset.price;
      setFeedbackSuccess(
        `Simulation Successful: Exchanged ${units} ${activeAsset.symbol} for ${formatCurrency(totalUSD)}.`
      );
    }
    setTradeAmount("");
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Market Rates & Trading
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time quotes for crypto and stock equities. Simulate asset swaps with paper balance.
          </p>
        </div>

        <button
          onClick={() => {
            mutateMarket();
            mutateUser();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-350 hover:bg-white/10 hover:text-white transition-all cursor-pointer font-sans"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* TICKERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(marketData).map(([key, asset]: [string, any]) => {
          const positive = asset.change >= 0;
          const isActive = key === activeAssetKey;

          return (
            <div
              key={key}
              onClick={() => setActiveAssetKey(key)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between h-36 ${
                isActive 
                  ? "bg-gradient-to-tr from-purple-950/40 via-[#0a0d18] to-purple-950/40 border-purple-500/50 shadow-md shadow-purple-500/5" 
                  : "bg-white/2 border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-slate-400">{asset.name}</h4>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{asset.symbol}</span>
                </div>
                <div className={`p-1.5 rounded-lg ${positive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>

              <div className="flex justify-between items-baseline mt-4">
                <span className="text-lg font-extrabold text-white font-mono">{formatCurrency(asset.price)}</span>
                <span className={`text-xs font-bold font-mono ${positive ? "text-emerald-450" : "text-red-450"}`}>
                  {positive ? "+" : ""}{asset.change}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* DETAILED WORKSTATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* CHART DETAILS */}
        <div className="lg:col-span-7 glass rounded-2xl p-6 border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Quotation</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{activeAsset.name} ({activeAsset.symbol})</h3>
              </div>
              <div className="text-right">
                <h3 className="text-2xl font-extrabold text-white font-mono">{formatCurrency(activeAsset.price)}</h3>
                <span className={`text-xs font-bold font-mono ${activeAsset.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {activeAsset.change >= 0 ? "+" : ""}{activeAsset.change}%
                </span>
              </div>
            </div>

            <div className="h-56 mt-8 flex items-center justify-center relative border-t border-b border-white/5 py-4">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <TrendingUp className="w-48 h-48 text-white" />
              </div>
              {renderSparkline(activeAsset.sparkline, activeAsset.change >= 0)}
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-4 font-mono">
            <span>Price updates automatically every 4 seconds</span>
            <span>Index: Binance / Nasdaq Composite</span>
          </div>
        </div>

        {/* SWAP CALCULATOR */}
        <div className="lg:col-span-5 glass rounded-2xl p-6 border border-white/5 space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Asset Swap Simulator
          </h4>

          {feedbackError && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}

          {feedbackSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-250 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSimulateSwap} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTradeType("buy")}
                className={`py-3 rounded-xl text-xs font-bold transition-all ${
                  tradeType === "buy" 
                    ? "bg-purple-500/20 border border-purple-500/30 text-white" 
                    : "bg-white/2 border border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                Liquid Cash → {activeAsset.symbol}
              </button>
              <button
                type="button"
                onClick={() => setTradeType("sell")}
                className={`py-3 rounded-xl text-xs font-bold transition-all ${
                  tradeType === "sell" 
                    ? "bg-purple-500/20 border border-purple-500/30 text-white" 
                    : "bg-white/2 border border-white/5 text-slate-400 hover:bg-white/5"
                }`}
              >
                {activeAsset.symbol} → Liquid Cash
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {tradeType === "buy" ? "Spend Capital (USD)" : `Exchange Units (${activeAsset.symbol})`}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  {tradeType === "buy" ? <DollarSign className="h-4 w-4 text-slate-500" /> : <ArrowRightLeft className="h-4 w-4 text-slate-500" />}
                </div>
                <input
                  type="number"
                  required
                  min="0.0001"
                  step="any"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder={tradeType === "buy" ? "1000.00" : "0.50"}
                  className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-purple-500 text-sm font-sans"
                />
              </div>
              {tradeType === "buy" && (
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Available to spend: {formatCurrency(currentUser?.balance || 0)}
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Calculated Rate:</span>
                <span className="font-mono text-white">{formatCurrency(activeAsset.price)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Estimated Receipt:</span>
                <span className="font-mono font-bold text-emerald-450">
                  {tradeType === "buy" 
                    ? `${(parseFloat(tradeAmount || "0") / activeAsset.price).toFixed(6)} ${activeAsset.symbol}`
                    : formatCurrency(parseFloat(tradeAmount || "0") * activeAsset.price)
                  }
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={currentUser?.status === "suspended"}
              className="w-full py-3 bg-gradient-purple-blue text-white rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer font-sans"
            >
              Simulate Allocation Swap
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
