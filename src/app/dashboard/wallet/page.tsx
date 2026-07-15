"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Send, Plus, ArrowUpRight, ArrowDownLeft, 
  X, Check, AlertCircle, ShieldAlert, Copy 
} from "lucide-react";
import useSWR from "swr";

import { QRCodeSVG } from "qrcode.react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WalletPage() {
  const { data: currentUser, mutate } = useSWR("/api/user/profile", fetcher);

  // Modals state
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Form states
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendDesc, setSendDesc] = useState("");
  const [sendCategory, setSendCategory] = useState("Transfer");
  
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("Bitcoin");
  const [depositProof, setDepositProof] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("Bitcoin");
  const [withdrawProof, setWithdrawProof] = useState("");

  // Feedback states
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [depositError, setDepositError] = useState("");
  const [depositSuccess, setDepositSuccess] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMoney = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");
    setSendSuccess("");

    const amountNum = parseFloat(sendAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setSendError("Please enter a valid amount.");
      return;
    }

    if (!recipientEmail) {
      setSendError("Please provide a recipient email.");
      return;
    }

    const processTransfer = async () => {
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "transfer_send",
            amount: amountNum,
            category: sendCategory,
            description: sendDesc || "Instant Vault Transfer",
            targetEmail: recipientEmail
          })
        });

        const result = await res.json();
        if (result.success) {
          setSendSuccess(result.message);
          setRecipientEmail("");
          setSendAmount("");
          setSendDesc("");
          mutate();
          setTimeout(() => {
            setSendModalOpen(false);
            setSendSuccess("");
          }, 1500);
        } else {
          setSendError(result.message);
        }
      } catch (err) {
        setSendError("Failed to process transaction.");
      }
    };
    processTransfer();
  };

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError("");
    setDepositSuccess("");

    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setDepositError("Please enter a valid amount.");
      return;
    }

    if (!depositProof) {
      setDepositError("Please enter transaction hash / reference details.");
      return;
    }

    const processDeposit = async () => {
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "deposit",
            amount: amountNum,
            category: "Deposit",
            description: `Deposit via ${depositMethod}`,
            method: depositMethod,
            proof: depositProof
          })
        });

        const result = await res.json();
        
        if (result.success) {
          setDepositSuccess(result.message);
          setDepositAmount("");
          setDepositProof("");
          mutate();
          setTimeout(() => {
            setDepositModalOpen(false);
            setDepositSuccess("");
          }, 2000);
        } else {
          setDepositError(result.message);
        }
      } catch (err) {
        setDepositError("Failed to add funds.");
      }
    };
    processDeposit();
  };

  const handleWithdrawFunds = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");

    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawError("Please enter a valid amount.");
      return;
    }

    if (!withdrawProof) {
      setWithdrawError("Please enter target payout destination details.");
      return;
    }

    const processWithdraw = async () => {
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "withdrawal",
            amount: amountNum,
            category: "Withdrawal",
            description: `Withdrawal via ${withdrawMethod}`,
            method: withdrawMethod,
            proof: withdrawProof
          })
        });

        const result = await res.json();
        
        if (result.success) {
          setWithdrawSuccess(result.message);
          setWithdrawAmount("");
          setWithdrawProof("");
          mutate();
          setTimeout(() => {
            setWithdrawModalOpen(false);
            setWithdrawSuccess("");
          }, 2000);
        } else {
          setWithdrawError(result.message);
        }
      } catch (err) {
        setWithdrawError("Failed to request withdrawal.");
      }
    };
    processWithdraw();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  const getDepositInstructions = () => {
    switch (depositMethod) {
      case "Bitcoin":
        return {
          address: "bc1qu92ptsa3vs4mmr53677vxk3whxdtudrxvtkq6j",
          label: "Bitcoin (BTC)",
          network: "Bitcoin Network"
        };
      case "USDT":
        return {
          address: "0x4CF3C7FdfDEd9f46bb36b5EF38e16ec0ec730761",
          label: "USDT Tether",
          network: "ERC20/TRC20 Compatible"
        };
      default:
        return null;
    }
  };

  const instructions = getDepositInstructions();

  const cryptoWallets = [
    { coin: "USD Mainnet Vault", symbol: "USDV", balance: currentUser?.balance || 0, rate: "$1.00", icon: "$", color: "from-blue-500 to-indigo-600" },
    { coin: "Bitcoin Ledger", symbol: "BTC", balance: 0.8402, rate: "$65,420.00", icon: "₿", color: "from-amber-500 to-orange-600" },
    { coin: "Ethereum Ledger", symbol: "ETH", balance: 12.45, rate: "$3,450.00", icon: "Ξ", color: "from-brand-emerald to-pink-600" }
  ];

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            Wallet & Cards
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your card statements, deposits, and borderless wires.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button
            onClick={() => setDepositModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            Deposit
          </button>
          <button
            onClick={() => setWithdrawModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 text-brand-emerald" />
            Withdraw
          </button>
          <button
            onClick={() => setSendModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-neon hover:brightness-110 active:scale-98 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Send Money
          </button>
        </div>
      </div>

      {/* SUSPENDED ACCOUNT BANNER */}
      {currentUser?.status === "suspended" && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-200">Account Frozen</h4>
            <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
              Your account transactions are temporarily disabled by compliance. You may view assets, but wire operations are blocked until further notice.
            </p>
          </div>
        </div>
      )}

      {/* CARDS LIST SECTION */}
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Linked Debit & Credit Cards
        </h4>

        {currentUser?.cards.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass text-slate-500 text-sm">
            No cards linked to this account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentUser?.cards.map((card: any) => (
              <motion.div
                key={card.id}
                whileHover={{ scale: 1.01 }}
                className={`rounded-2xl p-6 relative overflow-hidden text-white flex flex-col justify-between h-48 border shadow-lg ${
                  card.type === "visa"
                    ? "bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-950 border-brand-emerald/20"
                    : "bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 border-blue-500/20"
                }`}
              >
                <div className="absolute right-4 top-4 text-xs font-mono font-bold tracking-widest text-white/30 uppercase">
                  {card.type}
                </div>
                
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">CARD VAULT BAL</span>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(card.balance)}</h3>
                </div>

                <div>
                  <p className="text-sm font-mono tracking-widest font-medium text-slate-200">{card.number}</p>
                  
                  <div className="flex justify-between items-center mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <div>
                      <p className="text-[8px] text-slate-500">CARDHOLDER</p>
                      <p className="mt-0.5 text-slate-350">{card.name}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-500">EXPIRES</p>
                      <p className="mt-0.5 text-slate-350">{card.expiry}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MULTI-CURRENCY VAULTS */}
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Account Vault Ledgers
        </h4>

        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="divide-y divide-white/5">
            {cryptoWallets.map((wallet) => (
              <div 
                key={wallet.symbol} 
                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/1"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${wallet.color} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                    {wallet.icon}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">{wallet.coin}</h5>
                    <span className="text-xs text-slate-500 font-mono tracking-wider mt-0.5 block">{wallet.symbol}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right w-full sm:w-auto">
                  <h5 className="text-base font-extrabold text-white">
                    {wallet.symbol === "USDV"
                      ? formatCurrency(wallet.balance)
                      : `${wallet.balance.toLocaleString()} ${wallet.symbol}`
                    }
                  </h5>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    {wallet.symbol === "USDV" ? "Stable Asset" : `Rate: ${wallet.rate}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: SEND MONEY */}
      <AnimatePresence>
        {sendModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setSendModalOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#090c16] border border-white/10 rounded-2xl shadow-2xl p-6 z-10"
            >
              <button 
                onClick={() => setSendModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-extrabold text-white mb-4">Send Instant Funds</h3>

              {sendError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}

              {sendSuccess && (
                <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{sendSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSendMoney} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@primewealth.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald text-sm font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="100.00"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald text-sm font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={sendCategory}
                      onChange={(e) => setSendCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#090c16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-emerald text-sm font-sans"
                    >
                      <option value="Transfer">Transfer</option>
                      <option value="Investments">Investments</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Salary">Salary</option>
                      <option value="Shopping">Shopping</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Memo / Reference
                  </label>
                  <input
                    type="text"
                    value={sendDesc}
                    onChange={(e) => setSendDesc(e.target.value)}
                    placeholder="Consulting fee payment"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald text-sm font-sans"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={currentUser?.status === "suspended"}
                    className="w-full py-3 bg-gradient-neon text-[#022c22] rounded-xl text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer font-sans"
                  >
                    Clear Wire Clearance
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DEPOSIT FUNDS */}
      <AnimatePresence>
        {depositModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setDepositModalOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#090c16] border border-white/10 rounded-2xl shadow-2xl p-6 z-10"
            >
              <button 
                onClick={() => setDepositModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-extrabold text-white mb-4">Deposit Assets</h3>

              {depositError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{depositError}</span>
                </div>
              )}

              {depositSuccess && (
                <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{depositSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddFunds} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Deposit Method
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#090c16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-emerald text-sm font-sans"
                  >
                    <option value="Bitcoin">Bitcoin (BTC)</option>
                    <option value="USDT">USDT Tether</option>
                  </select>
                </div>

                {instructions && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-brand-emerald font-bold uppercase tracking-wider">
                        {instructions.label}
                      </p>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold">
                        {instructions.network}
                      </span>
                    </div>

                    <div className="flex justify-center bg-white p-2 rounded-xl w-fit mx-auto">
                      <QRCodeSVG value={instructions.address} size={140} level="H" />
                    </div>

                    <div className="flex items-center justify-between gap-2 bg-black/40 p-2.5 rounded-lg border border-white/5">
                      <span className="text-xs font-mono select-all text-slate-350 truncate">
                        {instructions.address}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(instructions.address)}
                        className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
                        title="Copy Address"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-yellow-200/80 leading-relaxed font-semibold">
                        Only send supported assets to this wallet address. Sending unsupported assets may result in permanent loss.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Deposit Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="1000.00"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald text-sm font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Transaction Hash (TXID)
                  </label>
                  <input
                    type="text"
                    required
                    value={depositProof}
                    onChange={(e) => setDepositProof(e.target.value)}
                    placeholder="Enter the exact TXID hash after sending"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald text-sm font-sans"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={currentUser?.status === "suspended"}
                    className="w-full py-3 bg-gradient-neon text-[#022c22] rounded-xl text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer font-sans"
                  >
                    Submit Deposit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: WITHDRAW FUNDS */}
      <AnimatePresence>
        {withdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setWithdrawModalOpen(false)} 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#090c16] border border-white/10 rounded-2xl shadow-2xl p-6 z-10"
            >
              <button 
                onClick={() => setWithdrawModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-extrabold text-white mb-4">Request Withdrawal</h3>

              {withdrawError && (
                <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccess && (
                <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              <form onSubmit={handleWithdrawFunds} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Withdrawal Channel
                  </label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#090c16] border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-emerald text-sm font-sans"
                  >
                    <option value="Bitcoin">Bitcoin (BTC)</option>
                    <option value="USDT">USDT (ERC-20)</option>
                    <option value="Cash App">Cash App</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Withdrawal Amount ($)
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald text-sm font-sans"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Available Liquid balance: {formatCurrency(currentUser?.balance || 0)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Target Address / Account Details
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawProof}
                    onChange={(e) => setWithdrawProof(e.target.value)}
                    placeholder={
                      withdrawMethod === "Bitcoin" || withdrawMethod === "USDT" 
                        ? "Enter your crypto wallet address" 
                        : withdrawMethod === "Cash App" 
                          ? "Enter your $Cashtag username" 
                          : "Enter Bank routing and Account numbers"
                    }
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-emerald text-sm font-sans"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={currentUser?.status === "suspended"}
                    className="w-full py-3 bg-gradient-neon text-[#022c22] rounded-xl text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer font-sans"
                  >
                    Submit Withdrawal Request
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
