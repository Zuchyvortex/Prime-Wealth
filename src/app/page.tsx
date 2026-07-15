"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { 
  ShieldCheck, ArrowRight, ChevronDown, Check, Star, 
  TrendingUp, Wallet, Bell, Users, Eye, Menu, X, Landmark, Lock, Globe,
  DollarSign, Activity, ChevronLeft, ChevronRight, HelpCircle, ArrowUpRight
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { INVESTMENT_PLANS } from "@/lib/config";

// Animated counter component for trust stats
function Counter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 20);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <span>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  
  // Interactive preview state for plans calculator
  const [calcPlan, setCalcPlan] = useState<"starter" | "growth" | "elite" | "ultimate">("growth");
  const [calcAmount, setCalcAmount] = useState<number>(15000);

  const { data: marketData } = useSWR("/api/market", (url) => fetch(url).then(r => r.json()), {
    refreshInterval: 4000,
    fallbackData: {
      btc: { name: "Bitcoin", symbol: "BTC", price: 92450.00, change: 2.45, sparkline: [91200, 91500, 91100, 92000, 92450, 92800] },
      eth: { name: "Ethereum", symbol: "ETH", price: 3480.20, change: -1.15, sparkline: [3550, 3520, 3490, 3460, 3480, 3440] },
      tsla: { name: "Tesla Inc.", symbol: "TSLA", price: 178.45, change: 0.85, sparkline: [175, 176, 177, 178.5, 178.45, 179.20] },
      aapl: { name: "Apple Inc.", symbol: "AAPL", price: 182.30, change: 1.22, sparkline: [180, 181, 180.5, 181.8, 182.30, 183.10] }
    }
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(val);
  };

  const renderSparkline = (pointsData: number[], positive: boolean) => {
    if (!pointsData || pointsData.length === 0) return null;
    const min = Math.min(...pointsData);
    const max = Math.max(...pointsData);
    const range = max - min === 0 ? 1 : max - min;
    const width = 80;
    const height = 24;
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
          stroke={positive ? "#96F226" : "#ef4444"}
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  const pricingPlans = INVESTMENT_PLANS.map(plan => ({
    id: plan.id.toLowerCase(),
    name: plan.name,
    duration: `${plan.duration} Days`,
    yield: plan.yieldString,
    minDeposit: plan.min,
    description: plan.desc,
    features: plan.features,
    badge: plan.badge,
    highlight: plan.highlight,
    color: plan.color
  }));

  const features = [
    {
      icon: <Wallet className="w-6 h-6 text-[#96F226]" />,
      title: "Secure Wallet Management",
      description: "Hold your digital capital in multi-sig custody vaults protected by military-grade AES-256 keys."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-[#96F226]" />,
      title: "Investment Tracking",
      description: "Monitor visual trends of your equity holdings and yields with bank-grade analytical charts in real-time."
    },
    {
      icon: <Globe className="w-6 h-6 text-[#96F226]" />,
      title: "Real-Time Portfolio Dashboard",
      description: "Synchronized valuation reports tracking global asset pools and crypto listings with zero lag."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#96F226]" />,
      title: "Advanced Security Protection",
      description: "Rigid transaction ledger checks and automated warning loops that secure against fraud vectors."
    },
    {
      icon: <Users className="w-6 h-6 text-[#96F226]" />,
      title: "Human Support Chat",
      description: "Get immediate support round-the-clock from our team of dedicated professional wealth operators."
    }
  ];

  const testimonials = [
    {
      name: "Arthur Pendelton",
      role: "Sovereign Asset manager",
      quote: "Prime Wealth has completely revolutionized how we track yield performance. The dashboard is clean, fast, and highly reliable.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    {
      name: "Evelyn Sterling",
      role: "Corporate Treasurer, DevFlow LLC",
      quote: "The Elite Treasury tier exceeded all our performance marks. Their compliance-first audits keep our operational capital entirely secure.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
    },
    {
      name: "Vikram Mehta",
      role: "Private Investor",
      quote: "The interface makes tracking yields incredibly simple. Transparent fees, rapid withdrawals, and exceptional human support chat support.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
    }
  ];

  const faqs = [
    {
      question: "What is Prime Wealth and how does it safeguard my capital?",
      answer: "Prime Wealth is an elite digital wealth management platform. Your funds are secured in decentralized, multi-signature cold custody vaults backed by industry-standard assets, featuring round-the-clock administrative ledger supervision and state-of-the-art AES-256 encryption."
    },
    {
      question: "How do I choose the correct Investment Plan?",
      answer: "We offer plans suited for varying capital sizes and holding durations. Our Starter Yield plan begins at $5,102.00 for 12 days, while the VIP Elite and Institutional plans support larger capital deployments with optimized yields up to 7000% APY."
    },
    {
      question: "Are there human support agents available?",
      answer: "Absolutely. Unlike basic automated systems, Prime Wealth integrates live human advisors and wealth desk agents available directly inside your dashboard chat window to verify queries and authorize major transfers."
    },
    {
      question: "How do withdrawal clearances operate?",
      answer: "Withdrawal requests are processed natively within your dashboard. For high-net-worth compliance, platform administrators audit parameters instantly, releasing funds to your designated external address within minutes."
    }
  ];

  const handleCalcPlanChange = (planId: "starter" | "growth" | "elite" | "ultimate") => {
    setCalcPlan(planId);
    const plan = pricingPlans.find(p => p.id === planId);
    if (plan && calcAmount < plan.minDeposit) {
      setCalcAmount(plan.minDeposit);
    }
  };

  const getCalcResults = () => {
    const plan = pricingPlans.find(p => p.id === calcPlan);
    if (!plan) return { yieldVal: 0, totalVal: 0, duration: "0 Days" };
    
    // Parse percentage yield
    const pctStr = plan.yield.replace("Up to ", "").replace("%", "");
    const multiplier = parseFloat(pctStr) / 100;
    const profit = calcAmount * multiplier;
    
    return {
      yieldVal: profit,
      totalVal: calcAmount + profit,
      duration: plan.duration
    };
  };

  const calcResults = getCalcResults();

  // Testimonials automatic rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-[#070913] text-slate-800 dark:text-slate-150 min-h-screen relative font-sans overflow-x-hidden">
      
      {/* 1. STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-50 glass-nav w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#96F226] to-[#10b981] p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#022c22] rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5.5 h-5.5 text-[#96F226]" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#022c22] dark:text-white flex items-center gap-1">
                PRIME <span className="text-[#10b981] dark:text-[#96F226]">WEALTH</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-600 dark:text-slate-350">
              <a href="#investments" className="hover:text-[#10b981] dark:hover:text-[#96F226] transition-colors font-semibold">Investments</a>
              <a href="#features" className="hover:text-[#10b981] dark:hover:text-[#96F226] transition-colors font-semibold">Features</a>
              <a href="#dashboard-preview" className="hover:text-[#10b981] dark:hover:text-[#96F226] transition-colors font-semibold">Market</a>
              <a href="#how-it-works" className="hover:text-[#10b981] dark:hover:text-[#96F226] transition-colors font-semibold">About</a>
              <a href="#faq" className="hover:text-[#10b981] dark:hover:text-[#96F226] transition-colors font-semibold">Support</a>
            </nav>

            {/* Right side controls */}
            <div className="hidden md:flex items-center space-x-5">
              <ThemeToggle />
              <Link href="/login" onClick={() => window.location.href = '/login'} className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-[#10b981] dark:hover:text-white transition-colors cursor-pointer">
                Login
              </Link>
              <Link href="/register" onClick={() => window.location.href = '/register'} className="inline-flex items-center justify-center px-4.5 py-2.5 rounded-xl text-sm font-bold text-[#022c22] bg-[#96F226] hover:bg-[#82df1e] hover:scale-[1.03] active:scale-[0.98] transition-all shadow-md shadow-brand-neon-green/10 cursor-pointer">
                Register
              </Link>
            </div>

            {/* Mobile Menu Toggle & ThemeToggle */}
            <div className="md:hidden flex items-center space-x-3">
              <ThemeToggle />
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#070913]/95 backdrop-blur-lg px-4 pt-4 pb-6 space-y-3 shadow-xl"
            >
              <a 
                href="#investments" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-brand-emerald dark:hover:text-[#96F226]"
              >
                Investments
              </a>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-brand-emerald dark:hover:text-[#96F226]"
              >
                Features
              </a>
              <a 
                href="#dashboard-preview" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-brand-emerald dark:hover:text-[#96F226]"
              >
                Market
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-brand-emerald dark:hover:text-[#96F226]"
              >
                About
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-brand-emerald dark:hover:text-[#96F226]"
              >
                Support
              </a>
              <div className="pt-4 flex flex-col gap-3">
                <Link 
                  href="/login"
                  onClick={() => window.location.href = '/login'}
                  className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer block"
                >
                  Login
                </Link>
                <Link 
                  href="/register"
                  onClick={() => window.location.href = '/register'}
                  className="w-full text-center py-2.5 rounded-xl bg-[#96F226] text-sm font-bold text-[#022c22] shadow-lg shadow-brand-neon-green/10 cursor-pointer block"
                >
                  Register
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. HERO SECTION */}
      <section 
        className="relative text-white pt-20 pb-32 sm:pt-28 sm:pb-40 rounded-b-[40px] md:rounded-b-[60px] overflow-hidden"
        style={{ background: 'radial-gradient(circle at 20% 30%, #022c22 0%, #064e3b 40%, #053b2d 70%, #032018 100%)' }}
      >
        {/* Glow lights */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#10b981]/10 rounded-full blur-[150px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-[#96F226]/5 rounded-full blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-20">
            {/* Pill Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#022c22]/60 border border-[#10b981]/30 text-xs font-semibold text-[#96F226] mb-6 animate-float"
            >
              <span className="w-2 h-2 rounded-full bg-[#96F226] animate-ping" />
              New: Premium Wealth Custody ✦
            </motion.div>

            {/* Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white"
            >
              Build Wealth Smarter <br className="hidden sm:inline" />
              <span className="text-gradient-emerald">With Prime Wealth</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed font-light max-w-2xl mx-auto mb-10"
            >
              A modern crypto investment platform built for investors seeking smarter financial growth, advanced protection, and portfolio management.
            </motion.p>
            
            {/* Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/register" onClick={() => window.location.href = '/register'} className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl font-extrabold text-[#022c22] bg-[#96F226] hover:bg-[#82df1e] hover:scale-[1.03] active:scale-[0.98] transition-all shadow-xl shadow-[#96F226]/10 cursor-pointer group">
                Start Investing <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="#investments" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer">
                Explore Plans
              </a>
            </motion.div>
          </div>

          {/* Interactive Floating Dashboard Mockup (Hero Visual) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mx-auto max-w-5xl group"
          >
            {/* Soft decorative glow */}
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#10b981] to-[#96F226] rounded-[24px] blur-2xl opacity-20 group-hover:opacity-35 transition-opacity duration-700" />
            
            {/* Dashboard Mockup Container */}
            <div className="glass-premium rounded-[20px] md:rounded-[24px] p-4 md:p-6 relative overflow-hidden">
              {/* Window Controls */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 md:mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-[10px] text-[#96F226] font-mono uppercase tracking-widest bg-[#022c22]/80 px-3 py-1 rounded-full border border-[#10b981]/30">
                  Secure Node Console v2.04
                </span>
              </div>

              {/* Mockup Content Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
                {/* Left Side: Performance Chart & Wallet Details */}
                <div className="lg:col-span-8 space-y-5 md:space-y-6">
                  {/* Balance details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#022c22]/80 border border-[#10b981]/20 rounded-xl p-4.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Assets</p>
                      <h4 className="text-xl md:text-2xl font-bold font-mono text-white">$124,502.80</h4>
                      <span className="text-[10px] text-[#96F226] font-bold flex items-center gap-1 mt-1">
                        +14.5% <Activity className="w-3 h-3" /> this month
                      </span>
                    </div>

                    <div className="bg-[#022c22]/40 border border-white/5 rounded-xl p-4.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Active Yields</p>
                      <h4 className="text-xl md:text-2xl font-bold font-mono text-[#96F226]">$45,750.00</h4>
                      <span className="text-[10px] text-slate-400">Growth Yield Plan</span>
                    </div>

                    <div className="bg-[#022c22]/40 border border-white/5 rounded-xl p-4.5">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Unreleased Profit</p>
                      <h4 className="text-xl md:text-2xl font-bold font-mono text-amber-400">$12,852.12</h4>
                      <span className="text-[10px] text-amber-400 flex items-center gap-0.5 mt-0.5 font-bold">
                        ★ VIP Tiers
                      </span>
                    </div>
                  </div>

                  {/* Simulated investment chart */}
                  <div className="bg-[#022c22]/40 border border-white/5 rounded-xl p-5 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Portfolio Yield Trend</p>
                        <span className="text-lg font-bold font-mono text-white">$124,502.80</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] bg-[#96F226]/10 text-[#96F226] border border-[#96F226]/30 px-2 py-0.5 rounded-md font-bold">1W</span>
                        <span className="text-[10px] hover:bg-white/5 text-slate-400 px-2 py-0.5 rounded-md">1M</span>
                        <span className="text-[10px] hover:bg-white/5 text-slate-400 px-2 py-0.5 rounded-md">ALL</span>
                      </div>
                    </div>

                    {/* Custom animated SVG Chart line */}
                    <div className="h-44 w-full relative pt-2">
                      <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#96F226" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#96F226" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        
                        {/* Gradient fill */}
                        <path
                          d="M0 120 Q 80 80, 150 95 T 300 45 T 420 25 T 500 15 L 500 120 Z"
                          fill="url(#chartGradient)"
                        />
                        
                        {/* Animated chart path */}
                        <motion.path
                          d="M0 120 Q 80 80, 150 95 T 300 45 T 420 25 T 500 15"
                          fill="none"
                          stroke="#96F226"
                          strokeWidth="2.5"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                        />
                        
                        {/* Blip dots */}
                        <circle cx="500" cy="15" r="4.5" fill="#96F226" className="animate-ping" />
                        <circle cx="500" cy="15" r="3" fill="#ffffff" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Right Side: Crypto Holdings Widget & Market updates */}
                <div className="lg:col-span-4 space-y-5 md:space-y-6">
                  {/* Ledger Cards */}
                  <div className="bg-[#022c22]/50 border border-white/5 rounded-xl p-4.5 space-y-3.5">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Live Assets Ticker</p>
                    
                    {marketData && Object.values(marketData).slice(0, 3).map((asset: any) => {
                      const positive = asset.change >= 0;
                      return (
                        <div key={asset.symbol} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0 last:pb-0">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{asset.name}</span>
                              <span className="text-[8px] font-mono text-slate-500 uppercase">{asset.symbol}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{formatCurrency(asset.price)}</span>
                          </div>
                          <div className="text-right">
                            {renderSparkline(asset.sparkline, positive)}
                            <span className={`text-[9px] font-mono font-bold block mt-0.5 ${positive ? "text-brand-neon-green" : "text-red-400"}`}>
                              {positive ? "+" : ""}{asset.change}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Transaction log mockup */}
                  <div className="bg-[#022c22]/50 border border-white/5 rounded-xl p-4.5 space-y-3">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Recent Clearances</p>
                    
                    <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-5.5 h-5.5 rounded-full bg-[#96F226]/10 flex items-center justify-center text-[#96F226] text-[9px] font-bold">+$</div>
                        <div>
                          <p className="text-[10px] font-bold text-white leading-tight">Deposit Cleared</p>
                          <p className="text-[8px] text-slate-400">Secure Bank Ledger</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#96F226]">+$15,750</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-5.5 h-5.5 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 text-[9px] font-bold">★</div>
                        <div>
                          <p className="text-[10px] font-bold text-white leading-tight">Plan Subscribed</p>
                          <p className="text-[8px] text-slate-400">Growth Plan 20D</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-white">-$10,450</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. TRUST SECTION & STATS TICKER */}
      <section className="bg-slate-50 dark:bg-[#090C16] py-16 border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* As featured on */}
          <div className="text-center mb-10">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-6">As featured on leading publications</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-50 dark:opacity-40 grayscale hover:grayscale-0 transition-all duration-300">
              <span className="text-lg md:text-xl font-bold tracking-tighter text-slate-800 dark:text-white">USA TODAY</span>
              <span className="text-lg md:text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">Bloomberg</span>
              <span className="text-lg md:text-xl font-bold tracking-widest text-slate-800 dark:text-white">TechCrunch</span>
              <span className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Forbes</span>
              <span className="text-lg md:text-xl font-extrabold tracking-tighter text-slate-800 dark:text-white">techradar</span>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-white/10 pt-12 mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {/* Stat 1 */}
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#10b981] dark:text-[#96F226] font-mono">
                $<Counter value={4} />.<Counter value={8} duration={1} />B+
              </p>
              <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Total Assets Managed</h5>
            </div>
            {/* Stat 2 */}
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#022c22] dark:text-white font-mono">
                <Counter value={120} />K+
              </p>
              <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Active Investors</h5>
            </div>
            {/* Stat 3 */}
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#10b981] dark:text-[#96F226] font-mono">
                <Counter value={99} />.<Counter value={9} duration={1} />%
              </p>
              <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Successful Transactions</h5>
            </div>
            {/* Stat 4 */}
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#022c22] dark:text-white font-mono">
                24/7
              </p>
              <h5 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Verified Human Support</h5>
            </div>
          </div>

          {/* Trusted Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/2 rounded-xl border border-slate-200 dark:border-white/5">
              <ShieldCheck className="w-8 h-8 text-[#10b981] shrink-0" />
              <div>
                <h6 className="text-xs font-bold text-[#022c22] dark:text-white">Secure Platform</h6>
                <p className="text-[10px] text-slate-400">Military-grade protection</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/2 rounded-xl border border-slate-200 dark:border-white/5">
              <Lock className="w-8 h-8 text-[#10b981] shrink-0" />
              <div>
                <h6 className="text-xs font-bold text-[#022c22] dark:text-white">Advanced Protection</h6>
                <p className="text-[10px] text-slate-400">Cold storage multisig custody</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/2 rounded-xl border border-slate-200 dark:border-white/5">
              <Check className="w-8 h-8 text-[#10b981] shrink-0" />
              <div>
                <h6 className="text-xs font-bold text-[#022c22] dark:text-white">Verified Transactions</h6>
                <p className="text-[10px] text-slate-400">Instant blockchain ledger audit</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/2 rounded-xl border border-slate-200 dark:border-white/5">
              <Users className="w-8 h-8 text-[#10b981] shrink-0" />
              <div>
                <h6 className="text-xs font-bold text-[#022c22] dark:text-white">Human Support</h6>
                <p className="text-[10px] text-slate-400">Dedicated desk operators</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INVESTMENT PLANS SECTION */}
      <section id="investments" className="py-24 sm:py-32 relative bg-white dark:bg-brand-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#10b981] dark:text-[#96F226] tracking-widest uppercase">Yield Contracts</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#022c22] dark:text-white mt-2 tracking-tight">
              Elite Prime Wealth Investment Tiers
            </h3>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-light leading-relaxed">
              Unlock competitive yields with premium fixed-term contracts designed for modern portfolio managers. Spacing and thresholds are optimized for clear returns.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {pricingPlans.map((plan, i) => (
              <motion.div 
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onMouseEnter={() => setHoveredPlan(i)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`rounded-2xl p-6 flex flex-col justify-between relative transition-all duration-300 border ${
                  plan.highlight 
                    ? 'border-amber-500 bg-amber-950/20 shadow-2xl scale-[1.03]' 
                    : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/2'
                } ${hoveredPlan === i ? 'premium-shadow -translate-y-2' : ''}`}
              >
                {/* Badge header */}
                <div className="flex justify-between items-start mb-5">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    plan.highlight 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-emerald-500/10 text-[#10b981] border border-emerald-500/20'
                  }`}>
                    {plan.badge}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">{plan.duration}</span>
                </div>

                <div>
                  <h4 className={`text-xl font-bold ${plan.highlight ? 'text-amber-400' : 'text-[#022c22] dark:text-white'}`}>
                    {plan.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
                  
                  <div className="my-6 py-4 border-t border-b border-slate-200 dark:border-white/10">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs text-slate-450 uppercase font-semibold">Min Capital:</span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-350 font-mono">{formatCurrency(plan.minDeposit)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-450 uppercase font-semibold">Projected Yield:</span>
                      <span className={`text-2xl font-extrabold font-mono ${plan.highlight ? 'text-amber-400' : 'text-[#10b981]'}`}>
                        {plan.yield}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-350">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.highlight ? 'text-amber-400' : 'text-[#10b981]'}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto">
                  <Link 
                    href="/register" 
                    onClick={() => window.location.href = '/register'}
                    className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-extrabold text-center uppercase tracking-wider shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
                      plan.highlight 
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' 
                        : 'bg-[#022c22] hover:bg-brand-emerald-dark text-white dark:bg-white/5 dark:border dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    Select Plan <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Interactive Calculator Section */}
          <div className="mt-16 p-6 md:p-8 rounded-2xl bg-[#022c22] text-white border border-[#10b981]/30 premium-shadow">
            <h4 className="text-xl font-bold mb-2">Projected Yield Calculator</h4>
            <p className="text-xs text-slate-300 mb-6">Select a plan and define your deposit range to calculate estimated yield profits in real-time.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#96F226]">Select Target Tier</label>
                <div className="grid grid-cols-2 gap-2">
                  {pricingPlans.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => handleCalcPlanChange(p.id as any)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold text-center border transition-all ${
                        calcPlan === p.id 
                          ? 'bg-[#96F226] text-[#022c22] border-[#96F226]' 
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {p.name.replace(" Yield", "").replace(" Plan", "").replace(" Treasury", "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#96F226]">
                  <span>Investment Capital</span>
                  <span className="font-mono">{formatCurrency(calcAmount)}</span>
                </div>
                <input 
                  type="range"
                  min={pricingPlans.find(p => p.id === calcPlan)?.minDeposit || 5000}
                  max={250000}
                  step={500}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#96F226]"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>Min: {formatCurrency(pricingPlans.find(p => p.id === calcPlan)?.minDeposit || 5000)}</span>
                  <span>Max: $250,000.00</span>
                </div>
              </div>

              {/* Estimate Results */}
              <div className="bg-[#044a36]/60 border border-[#96F226]/20 rounded-xl p-4 text-center md:text-left flex flex-col justify-between h-full">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Total Profit Est.</p>
                  <h3 className="text-2xl font-extrabold font-mono text-[#96F226]">+{formatCurrency(calcResults.yieldVal)}</h3>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-[10px] text-slate-300">
                  <span>Duration: <strong>{calcResults.duration}</strong></span>
                  <span>Total Value: <strong>{formatCurrency(calcResults.totalVal)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PLATFORM FEATURES SECTION */}
      <section id="features" className="py-24 sm:py-32 bg-slate-50 dark:bg-[#090C16] border-t border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#10b981]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            {/* Left side info */}
            <div className="lg:col-span-5 space-y-6 mb-12 lg:mb-0">
              <h2 className="text-xs font-bold text-[#10b981] dark:text-[#96F226] tracking-widest uppercase">Platform Capabilities</h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#022c22] dark:text-white tracking-tight">
                Premium crypto wealth operations
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed">
                Prime Wealth combines institutional-grade wallets, custom transaction controls, and rapid administrative ledgers to keep your wealth optimized and fully compliant.
              </p>

              <div className="pt-4">
                <Link href="/register" onClick={() => window.location.href = '/register'} className="inline-flex items-center justify-center px-6 py-3 bg-[#022c22] hover:bg-[#064e3b] dark:bg-[#96F226] dark:hover:bg-[#82df1e] text-white dark:text-[#022c22] font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer">
                  Explore Console <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right side features grid */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feat, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-5.5 rounded-2xl bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 hover:border-[#10b981]/30 dark:hover:border-[#96F226]/30 transition-all duration-300 shadow-sm"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#022c22] flex items-center justify-center mb-4.5">
                    {feat.icon}
                  </div>
                  <h4 className="text-base font-bold text-[#022c22] dark:text-white mb-2">{feat.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">{feat.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. DASHBOARD PREVIEW SECTION */}
      <section id="dashboard-preview" className="py-24 sm:py-32 bg-white dark:bg-brand-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#10b981] dark:text-[#96F226] tracking-widest uppercase">Admin Preview</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#022c22] dark:text-white mt-2 tracking-tight">
              Interactive portfolio & performance tracking
            </h3>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-light">
              Observe transaction statuses, yields, and pending approvals directly inside the Prime Wealth administration interface.
            </p>
          </div>

          {/* Interactive Mockup Layout */}
          <div className="glass rounded-[24px] border border-slate-200 dark:border-white/5 p-4 md:p-6 shadow-xl relative overflow-hidden bg-slate-50 dark:bg-brand-dark-bg/60">
            {/* Soft background glow */}
            <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-[#10b981]/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Sidebar Mockup */}
              <div className="w-full lg:w-56 shrink-0 bg-white dark:bg-white/2 rounded-xl p-4 border border-slate-200 dark:border-white/5 flex flex-row lg:flex-col justify-between lg:justify-start gap-4">
                <div className="flex items-center gap-2 pb-0 lg:pb-4 border-b border-transparent lg:border-slate-100 lg:dark:border-white/5 w-full">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#96F226] to-[#10b981] p-0.5">
                    <div className="w-full h-full bg-[#022c22] rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-4.5 h-4.5 text-[#96F226]" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#022c22] dark:text-white uppercase font-mono tracking-wider hidden sm:inline">Prime Admin</span>
                </div>

                <nav className="flex flex-row lg:flex-col gap-1 w-full overflow-x-auto lg:overflow-x-visible">
                  <span className="px-3 py-2 rounded-lg bg-[#022c22] text-[#96F226] text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap">
                    <Activity className="w-4 h-4" /> Portfolio View
                  </span>
                  <span className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap">
                    <Wallet className="w-4 h-4" /> Active Deposits
                  </span>
                  <span className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap">
                    <Users className="w-4 h-4" /> Ledger Audits
                  </span>
                  <span className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap">
                    <Lock className="w-4 h-4" /> Security Settings
                  </span>
                </nav>
              </div>

              {/* Main Content Mockup Panel */}
              <div className="grow space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-white/2 rounded-xl p-4.5 border border-slate-200 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Account Value</p>
                    <h4 className="text-xl font-bold text-[#022c22] dark:text-white font-mono">$104,750.25</h4>
                    <span className="text-[9px] text-[#10b981] font-bold">100% Secure Custody</span>
                  </div>

                  <div className="bg-white dark:bg-white/2 rounded-xl p-4.5 border border-slate-200 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Current Active Plan</p>
                    <h4 className="text-xl font-bold text-[#10b981] font-mono">Elite Treasury</h4>
                    <span className="text-[9px] text-slate-450">40 Days Contract</span>
                  </div>

                  <div className="bg-white dark:bg-white/2 rounded-xl p-4.5 border border-slate-200 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Pending Clearance</p>
                    <h4 className="text-xl font-bold text-yellow-600 dark:text-yellow-500 font-mono">$0.00</h4>
                    <span className="text-[9px] text-[#10b981] font-bold">All Ledgers Cleared</span>
                  </div>
                </div>

                {/* Subsections: Live Chart & Transaction Logs */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* Left component: Chart preview */}
                  <div className="xl:col-span-7 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h5 className="text-xs font-bold text-[#022c22] dark:text-white uppercase tracking-wider">Asset Performance Index</h5>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5">Real-time composite valuation feeds</p>
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 text-[#10b981] border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">LIVE FEED</span>
                    </div>

                    <div className="h-40 w-full relative pt-2">
                      <svg viewBox="0 0 500 120" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="prevChartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 120 Q 70 90, 150 100 T 300 60 T 420 30 T 500 20 L 500 120 Z"
                          fill="url(#prevChartGradient)"
                        />
                        <path
                          d="M0 120 Q 70 90, 150 100 T 300 60 T 420 30 T 500 20"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                        <circle cx="500" cy="20" r="3.5" fill="#10b981" />
                      </svg>
                    </div>
                  </div>

                  {/* Right component: Recent ledger authorizations */}
                  <div className="xl:col-span-5 bg-white dark:bg-white/2 border border-slate-200 dark:border-white/5 rounded-xl p-5 shadow-sm space-y-3">
                    <h5 className="text-xs font-bold text-[#022c22] dark:text-white uppercase tracking-wider mb-2">Ledger Authorizations</h5>
                    
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 text-xs">
                        <div>
                          <p className="font-bold text-[#022c22] dark:text-white">External ETH Deposit</p>
                          <p className="text-[9px] text-slate-400">Tx: 0x9f1a...482c</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#10b981] bg-emerald-550/10 dark:bg-brand-emerald/10 px-2 py-0.5 rounded-md">APPROVED</span>
                      </div>

                      <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 text-xs">
                        <div>
                          <p className="font-bold text-[#022c22] dark:text-white">Starter Plan Yield Out</p>
                          <p className="text-[9px] text-slate-450">Withdrawal cleared</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#10b981] bg-emerald-550/10 dark:bg-brand-emerald/10 px-2 py-0.5 rounded-md">APPROVED</span>
                      </div>

                      <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 dark:bg-white/2 border border-slate-100 dark:border-white/5 text-xs">
                        <div>
                          <p className="font-bold text-[#022c22] dark:text-white">Elite Plan Purchase</p>
                          <p className="text-[9px] text-slate-450">Capital locked: 40D</p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-mono">LOCKED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. HOW PRIME WEALTH WORKS */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-slate-50 dark:bg-[#090C16] border-t border-b border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-xs font-bold text-[#10b981] dark:text-[#96F226] tracking-widest uppercase">Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#022c22] dark:text-white mt-2 tracking-tight">
              Simplified steps to wealth accumulation
            </h3>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-light">
              Get started with Prime Wealth in minutes. Our onboarding workflow guarantees a clean capital route.
            </p>
          </div>

          {/* Timeline workflow */}
          <div className="relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-12 left-6 right-6 h-0.5 bg-slate-200 dark:bg-white/10 z-0" />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
              {/* Step 1 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#022c22] text-[#96F226] flex items-center justify-center font-bold text-xl border border-brand-emerald/30 shadow-md">
                  1
                </div>
                <h4 className="text-base font-bold text-[#022c22] dark:text-white">Create Account</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Open your custom wallet interface and set secure custody parameters.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#022c22] text-[#96F226] flex items-center justify-center font-bold text-xl border border-brand-emerald/30 shadow-md">
                  2
                </div>
                <h4 className="text-base font-bold text-[#022c22] dark:text-white">Fund Wallet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Deposit funds or swap assets to initialize your primary balance ledger.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#022c22] text-[#96F226] flex items-center justify-center font-bold text-xl border border-brand-emerald/30 shadow-md">
                  3
                </div>
                <h4 className="text-base font-bold text-[#022c22] dark:text-white">Select Investment Plan</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Choose a fixed-term contract plan matching your target capital limits.
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#022c22] text-[#96F226] flex items-center justify-center font-bold text-xl border border-brand-emerald/30 shadow-md">
                  4
                </div>
                <h4 className="text-base font-bold text-[#022c22] dark:text-white">Monitor Portfolio</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Observe automatic daily updates on active yields, charts, and audits.
                </p>
              </div>

              {/* Step 5 */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-[#022c22] text-[#96F226] flex items-center justify-center font-bold text-xl border border-brand-emerald/30 shadow-md">
                  5
                </div>
                <h4 className="text-base font-bold text-[#022c22] dark:text-white">Request Withdrawal</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Verify transaction loops and request rapid payouts directly to external accounts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* 9. TESTIMONIALS SECTION */}
      <section className="py-24 sm:py-32 bg-slate-50 dark:bg-[#090C16] border-t border-b border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-[#10b981] dark:text-[#96F226] tracking-widest uppercase">Endorsements</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#022c22] dark:text-white mt-2 tracking-tight">
              What Prime Wealth investors say
            </h3>
            <p className="mt-4 text-slate-500 dark:text-slate-400 font-light">
              Read transparent feedback from private operators managing high-yield assets with us.
            </p>
          </div>

          {/* Carousel Testimonial Container */}
          <div className="max-w-4xl mx-auto relative px-4 md:px-12">
            <div className="overflow-hidden min-h-[260px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="bg-white dark:bg-white/2 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-white/5 shadow-md flex flex-col md:flex-row gap-6 md:gap-8 items-center"
                >
                  <img 
                    src={testimonials[currentTestimonial].image} 
                    alt={testimonials[currentTestimonial].name} 
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-brand-emerald/30 shadow-md shrink-0"
                  />
                  <div className="space-y-4 text-center md:text-left">
                    <div className="flex justify-center md:justify-start gap-1">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, r) => (
                        <Star key={r} className="w-4.5 h-4.5 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic text-sm md:text-base leading-relaxed font-light">
                      "{testimonials[currentTestimonial].quote}"
                    </p>
                    <div>
                      <h5 className="font-extrabold text-[#022c22] dark:text-white text-sm md:text-base">{testimonials[currentTestimonial].name}</h5>
                      <p className="text-slate-400 text-xs mt-0.5">{testimonials[currentTestimonial].role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-center md:justify-between items-center gap-6 mt-8 md:absolute md:top-1/2 md:-translate-y-1/2 md:left-0 md:right-0 md:px-2 pointer-events-none">
              <button 
                onClick={() => setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer pointer-events-auto shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentTestimonial(prev => (prev + 1) % testimonials.length)}
                className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer pointer-events-auto shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2.5 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${currentTestimonial === idx ? 'bg-[#10b981] w-5' : 'bg-slate-300 dark:bg-white/10'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section id="faq" className="py-24 sm:py-32 bg-white dark:bg-[#070913] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-[#10b981] dark:text-[#96F226] tracking-widest uppercase">Answers</h2>
            <h3 className="text-3xl font-extrabold text-[#022c22] dark:text-white mt-2 tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div 
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/2 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
                >
                  <span className="font-bold text-[#022c22] dark:text-white text-base md:text-lg flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-[#10b981] shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="p-6 pt-0 text-slate-550 dark:text-slate-400 text-xs md:text-sm leading-relaxed border-t border-slate-100 dark:border-white/5 bg-slate-100/30 dark:bg-[#070913]/30 font-light">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA SECTION */}
      <section className="py-20 sm:py-24 relative bg-white dark:bg-[#070913]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className="rounded-3xl text-white p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-2xl shadow-[#10b981]/10"
            style={{ background: 'radial-gradient(circle at 80% 20%, #064e3b 0%, #022c22 50%, #032018 100%)' }}
          >
            {/* Mesh decorative glows */}
            <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-[#96F226]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#10b981]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative max-w-3xl mx-auto space-y-6">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                Start Your Wealth Journey Today
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                Join a selected circle of investors and businesses managing their treasury and assets inside a fully secure, compliance-ready architecture.
              </p>
              
              <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/register"
                  onClick={() => window.location.href = '/register'}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-[#96F226] hover:bg-[#82df1e] text-[#022c22] font-bold rounded-xl shadow-2xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                >
                  Create Account
                </Link>
                <Link 
                  href="/login"
                  onClick={() => window.location.href = '/login'}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/20 transition-all cursor-pointer"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. REGULATORY FOOTER */}
      <footer className="bg-slate-100 dark:bg-[#05060d] border-t border-slate-200 dark:border-white/5 py-16 text-slate-500 dark:text-slate-500 text-xs leading-relaxed font-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#96F226] to-[#10b981] p-0.5">
                  <div className="w-full h-full bg-[#022c22] rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#96F226]" />
                  </div>
                </div>
                <span className="text-sm font-bold text-[#022c22] dark:text-white uppercase tracking-wider font-mono">PRIME WEALTH</span>
              </div>
              <p className="text-slate-400 dark:text-slate-450">
                Premium digital custody and real-time ledger architecture for modern crypto wealth.
              </p>
            </div>
            
            <div>
              <h5 className="font-bold text-[#022c22] dark:text-white text-xs uppercase tracking-wider mb-4">Investments</h5>
              <ul className="space-y-2">
                <li><a href="#investments" className="hover:text-brand-emerald dark:hover:text-white transition-colors">Yield Plans</a></li>
                <li><a href="#features" className="hover:text-brand-emerald dark:hover:text-white transition-colors">Security Audit</a></li>
                <li><a href="#dashboard-preview" className="hover:text-brand-emerald dark:hover:text-white transition-colors">Live Market</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#022c22] dark:text-white text-xs uppercase tracking-wider mb-4">Company</h5>
              <ul className="space-y-2">
                <li><a href="#how-it-works" className="hover:text-brand-emerald dark:hover:text-white transition-colors">About Us</a></li>
                <li><a href="#faq" className="hover:text-brand-emerald dark:hover:text-white transition-colors">Support Center</a></li>
                <li><a href="#" className="hover:text-brand-emerald dark:hover:text-white transition-colors">Cookie settings</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-[#022c22] dark:text-white text-xs uppercase tracking-wider mb-4">Regulatory Disclaimer</h5>
              <p className="text-slate-450 dark:text-slate-500">
                Prime Wealth is a private digital asset software provider. Rates of yield projection fluctuate based on liquidity pools. Crypto assets carry substantial risk.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-200 dark:border-white/5 pt-8">
            <p>&copy; {new Date().getFullYear()} Prime Wealth International LLC. All rights reserved.</p>
            <div className="flex gap-4 mt-4 sm:mt-0 text-slate-400 dark:text-slate-500">
              <a href="#" className="hover:text-[#022c22] dark:hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[#022c22] dark:hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-[#022c22] dark:hover:text-white transition-colors">License Keys</a>
              <Link href="/admin/login" onClick={() => window.location.href = '/admin/login'} className="text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors text-[10px] font-mono cursor-pointer">Administrator Access</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
