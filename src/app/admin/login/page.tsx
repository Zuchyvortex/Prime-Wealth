"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Activity,
  AlertTriangle,
  Copy,
  CheckCircle2,
  KeyRound,
  Server,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";

const ADMIN_EMAIL = "admin@primewealth.com";
const ADMIN_PASSWORD = "super_secure_admin_password";
const ADMIN_URL = "/admin/login";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-all cursor-pointer shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setLoginAttempts((prev) => prev + 1);
        setError("Invalid administrator credentials. Access denied.");
        setIsLoading(false);
      } else if (result?.ok) {
        window.location.href = "/admin/dashboard";
      } else {
        setError("Authentication failed. Please try again.");
        setIsLoading(false);
      }
    } catch {
      setError("Authentication system error. Please try again.");
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#070913] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="w-8 h-8 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] flex overflow-hidden">
      {/* ── LEFT PANEL ── System terminal aesthetic */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        {/* BG */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/60 via-[#070913] to-indigo-950/40" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[130px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[100px]" />
        </div>

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Prime<span className="text-purple-400">Admin</span>
            </span>
          </Link>
          {/* Live clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/4 border border-white/8 rounded-xl">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-slate-400">{currentTime}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full mb-6">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Restricted System Access</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Administrator<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                Control Center
              </span>
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-10">
              This portal is exclusively for authorized system administrators. All access attempts are logged, monitored, and audited in real-time.
            </p>
          </motion.div>

          {/* System status indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 mb-10"
          >
            {[
              { icon: Server, label: "Database", status: "Online", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Activity, label: "Auth System", status: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Terminal, label: "Audit Logging", status: "Running", color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: AlertTriangle, label: "Threat Monitor", status: "Clear", color: "text-blue-400", bg: "bg-blue-500/10" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-3 p-3 bg-white/3 border border-white/6 rounded-xl"
              >
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
                <span className="text-sm text-slate-400 flex-1">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.color === "text-emerald-400" ? "bg-emerald-400" : "bg-blue-400"} animate-pulse`} />
                  <span className={`text-xs font-semibold ${s.color}`}>{s.status}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── CREDENTIALS BOX ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative rounded-2xl overflow-hidden"
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
            <div className="bg-[#0a0d1a] border border-purple-500/15 rounded-2xl p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-300">Admin Credentials</span>
                <span className="ml-auto text-[10px] font-mono text-slate-600 uppercase tracking-widest">Confidential</span>
              </div>

              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/6 rounded-xl">
                  <span className="text-slate-600 text-xs w-16 shrink-0">URL</span>
                  <span className="text-slate-300 flex-1 truncate">{ADMIN_URL}</span>
                  <CopyButton text={ADMIN_URL} />
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/6 rounded-xl">
                  <span className="text-slate-600 text-xs w-16 shrink-0">Email</span>
                  <span className="text-slate-300 flex-1 truncate">{ADMIN_EMAIL}</span>
                  <CopyButton text={ADMIN_EMAIL} />
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/6 rounded-xl">
                  <span className="text-slate-600 text-xs w-16 shrink-0">Pass</span>
                  <span className="text-purple-300 flex-1 font-bold">{ADMIN_PASSWORD}</span>
                  <CopyButton text={ADMIN_PASSWORD} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-500/80">Change the default password after first login.</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-[11px] text-slate-700 font-mono uppercase tracking-widest text-center">
            🔒 All access attempts are logged and monitored
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── Admin login form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Prime<span className="text-purple-400">Admin</span>
            </span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Restricted Access</span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">Administrator Login</h2>
            <p className="mt-2 text-slate-500 text-sm">
              This area is restricted to authorized system administrators only.
            </p>
          </div>

          {/* Failed attempts warning */}
          <AnimatePresence>
            {loginAttempts >= 2 && (
              <motion.div
                key="attempts"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 bg-amber-950/40 border border-amber-500/25 rounded-2xl flex items-start gap-3"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Multiple failed attempts detected</p>
                  <p className="text-xs text-amber-500/80 mt-0.5">
                    {loginAttempts} failed attempts. This activity is being logged.
                  </p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 p-4 bg-red-950/60 border border-red-500/30 rounded-2xl text-sm text-red-200 flex items-center gap-3"
              >
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-300 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 hover:border-white/20 transition-all text-sm"
                  placeholder="admin@primewealth.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 hover:border-white/20 transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="admin-login-submit-btn"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-[#070913] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98] cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Access System Console
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Mobile credentials (visible only on mobile) */}
          <div className="lg:hidden mt-8">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
              <div className="bg-[#0a0d1a] border border-purple-500/15 rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-purple-300">Admin Credentials</span>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/6 rounded-xl">
                    <span className="text-slate-600 text-xs w-14 shrink-0">Email</span>
                    <span className="text-slate-300 flex-1 truncate text-xs">{ADMIN_EMAIL}</span>
                    <CopyButton text={ADMIN_EMAIL} />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/3 border border-white/6 rounded-xl">
                    <span className="text-slate-600 text-xs w-14 shrink-0">Pass</span>
                    <span className="text-purple-300 flex-1 font-bold">{ADMIN_PASSWORD}</span>
                    <CopyButton text={ADMIN_PASSWORD} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/6 space-y-3">
            <p className="text-center text-[10px] font-mono text-slate-700 uppercase tracking-widest">
              🔒 All access attempts are logged and monitored
            </p>
            <p className="text-center text-xs text-slate-600">
              Not an administrator?{" "}
              <Link href="/login" className="text-purple-500 hover:text-purple-400 transition-colors font-medium">
                Return to user login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
