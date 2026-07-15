"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw,
  BookOpen, Wallet, TrendingUp, ArrowDownLeft, MessageSquare, Shield,
  ChevronRight, CheckCircle2
} from "lucide-react";

const VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4"; // Placeholder — replace with your actual onboarding video URL

const chapters = [
  {
    id: 1,
    icon: <BookOpen className="w-5 h-5" />,
    title: "What is Prime Wealth?",
    desc: "An overview of the platform, its mission, and what sets it apart from traditional investment platforms.",
    time: "0:00",
    color: "from-brand-emerald to-indigo-600",
  },
  {
    id: 2,
    icon: <Wallet className="w-5 h-5" />,
    title: "How to Deposit Crypto",
    desc: "Step-by-step instructions for depositing Bitcoin (BTC) or USDT Tether to your Prime Wealth vault.",
    time: "1:20",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: 3,
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Investment Plans Explained",
    desc: "A deep-dive into Starter, Growth, and Elite yield plans — ROI percentages, durations, and profit projections.",
    time: "2:45",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: 4,
    icon: <ArrowDownLeft className="w-5 h-5" />,
    title: "Monitoring & Withdrawals",
    desc: "How to track your active investments, monitor profits in real-time, and submit a withdrawal request.",
    time: "4:10",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: 5,
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Support & Live Chat",
    desc: "How to use the built-in support chat to reach a compliance officer or account manager.",
    time: "5:30",
    color: "from-pink-500 to-rose-600",
  },
  {
    id: 6,
    icon: <Shield className="w-5 h-5" />,
    title: "Security & Trust",
    desc: "How Prime Wealth protects your funds, verifies deposits, and ensures a safe platform experience.",
    time: "6:50",
    color: "from-brand-emerald-dark to-brand-emerald-deep",
  },
];

const faqs = [
  { q: "Is there a minimum deposit amount?", a: "Yes. The minimum deposit is $10 USD equivalent in crypto. We recommend starting with at least $100 to see meaningful returns." },
  { q: "How long does deposit verification take?", a: "After submitting your TXID, an admin typically reviews and approves deposits within 1–24 hours during business days." },
  { q: "Can I withdraw at any time?", a: "Withdrawal requests are subject to admin review and compliance checks. Funds are typically released within 24–72 hours of approval." },
  { q: "What cryptocurrencies are accepted?", a: "We currently accept Bitcoin (BTC) and USDT Tether. More payment options may be added in future platform updates." },
  { q: "Are my funds insured?", a: "Prime Wealth employs best-in-class security practices. All deposit transactions are logged with full audit trails for transparency." },
];

export default function GuidePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setPlaying(true);
  };

  const handleFullscreen = () => {
    if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Platform Guides
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Everything you need to know about Prime Wealth — from first deposit to first profit.
        </p>
      </div>

      {/* VIDEO PLAYER */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl overflow-hidden border border-[var(--glass-border)] shadow-2xl shadow-brand-emerald/10 bg-black relative group"
      >
        {/* Cinematic overlay / gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none" />

        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setPlaying(false)}
          className="w-full aspect-video object-cover"
        />

        {/* Play/Pause overlay button */}
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
        >
          <motion.div
            key={playing ? "pause" : "play"}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: playing ? [1, 1.1, 1] : 1, opacity: playing ? 0 : 1 }}
            transition={{ duration: 0.3 }}
            className={`w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"} transition-opacity duration-200`}
          >
            {playing
              ? <Pause className="w-8 h-8 text-white fill-white" />
              : <Play className="w-8 h-8 text-white fill-white ml-1" />
            }
          </motion.div>
        </div>

        {/* Video title overlay */}
        {!playing && (
          <div className="absolute top-6 left-6 z-20">
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Prime Wealth</span>
            <h2 className="text-xl font-extrabold text-white mt-1">How Prime Wealth Works</h2>
            <p className="text-sm text-white/60 mt-0.5">Complete onboarding guide · 8 min</p>
          </div>
        )}

        {/* CONTROLS BAR */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/90 to-transparent">
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 relative group/bar"
          >
            <div
              className="h-full bg-gradient-neon rounded-full transition-all relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Button row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-brand-neon-green transition-colors">
                {playing ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>
              <button onClick={handleRestart} className="text-white/70 hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <span className="text-xs text-white/50 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <button onClick={handleFullscreen} className="text-white/70 hover:text-white transition-colors">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* CHAPTERS */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Video Chapters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.map((ch, i) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-2xl p-5 border border-[var(--glass-border)] hover:border-brand-emerald/30 transition-all group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${ch.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                {ch.icon}
              </div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-foreground leading-snug">{ch.title}</h3>
                <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">{ch.time}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{ch.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ SECTION */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2 max-w-3xl">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl border border-[var(--glass-border)] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
              >
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-slate-500 leading-relaxed border-t border-[var(--glass-border)] pt-3">
                  {faq.a}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-3xl p-8 bg-gradient-to-r from-emerald-600/20 via-brand-emerald/20 to-blue-600/20 border border-brand-emerald/20 flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-neon flex items-center justify-center text-white shadow-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">Ready to start investing?</h3>
            <p className="text-sm text-slate-500 mt-0.5">Deposit crypto and activate a yield plan today.</p>
          </div>
        </div>
        <a
          href="/dashboard/wallet"
          className="px-6 py-3 bg-gradient-neon text-[#022c22] rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-md shrink-0"
        >
          Go to Wallet →
        </a>
      </motion.div>

    </div>
  );
}
