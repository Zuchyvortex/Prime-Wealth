"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Phone,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Zap,
  Globe,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { signIn, useSession } from "next-auth/react";

const perks = [
  { icon: TrendingUp, text: "Earn up to 18% ROI on investments" },
  { icon: ShieldCheck, text: "Bank-grade security & encryption" },
  { icon: Zap, text: "Instant deposits & withdrawals" },
  { icon: Globe, text: "Access from 150+ countries" },
];

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 6 characters", pass: password.length >= 6 },
    { label: "Contains a number", pass: /\d/.test(password) },
    { label: "Contains a letter", pass: /[a-zA-Z]/.test(password) },
  ];
  const strength = checks.filter((c) => c.pass).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-emerald-500"];
  const labels = ["", "Weak", "Fair", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength ? colors[strength] : "bg-white/10"
            }`}
          />
        ))}
        <span className={`text-xs font-medium ml-1 ${strength === 3 ? "text-emerald-400" : strength === 2 ? "text-yellow-400" : "text-red-400"}`}>
          {labels[strength]}
        </span>
      </div>
      <div className="space-y-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            {c.pass ? (
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-600 shrink-0" />
            )}
            <span className={`text-xs ${c.pass ? "text-slate-400" : "text-slate-600"}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service to continue.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone: phone || undefined }),
      });

      const data = await res.json();
      if (data.success) {
        const signInResult = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.ok) {
          window.location.href = "/dashboard";
        } else {
          window.location.href = "/login?registered=1";
        }
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#070913] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] flex overflow-hidden">
      {/* ── LEFT PANEL ── Brand */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-[#070913] to-teal-950/40" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Prime<span className="text-emerald-400">Wealth</span>
            </span>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Start for Free</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6">
              Join 50,000+<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                smart investors.
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
              Create your free account and start building generational wealth with our intelligent investment platform.
            </p>
          </motion.div>

          <div className="space-y-4">
            {perks.map((p, i) => (
              <motion.div
                key={p.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <p.icon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-sm text-slate-300">{p.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 p-4 bg-white/3 border border-white/6 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((l, i) => (
                  <div
                    key={l}
                    className="w-8 h-8 rounded-full border-2 border-[#070913] flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `hsl(${160 + i * 20}, 60%, 40%)` }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Joined this week</p>
                <p className="text-xs text-slate-500">247 new investors</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-bit SSL encrypted · No hidden fees · Cancel anytime</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── Register form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-10 overflow-y-auto relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Prime<span className="text-emerald-400">Wealth</span>
            </span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white tracking-tight">Create your account</h2>
            <p className="mt-2 text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 p-4 bg-red-950/60 border border-red-500/30 rounded-2xl text-sm text-red-200 flex items-center gap-3"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-white/20 transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-white/20 transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-300 mb-2">
                Phone Number <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-white/20 transition-all text-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-white/20 transition-all text-sm"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-300 mb-2">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-slate-500" />
                </div>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-11 pr-12 py-3.5 bg-white/5 border rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:border-white/20 transition-all text-sm ${
                    confirmPassword && confirmPassword !== password
                      ? "border-red-500/50 focus:border-red-500/50"
                      : confirmPassword && confirmPassword === password
                      ? "border-emerald-500/50 focus:border-emerald-500/50"
                      : "border-white/10 focus:border-emerald-500/50"
                  }`}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
                {confirmPassword && (
                  <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                    {confirmPassword === password ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group pt-1">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className="w-5 h-5 rounded-md border border-white/15 bg-white/5 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center cursor-pointer"
                >
                  {agreedToTerms && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
              <span className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                I agree to Prime Wealth&apos;s{" "}
                <a href="#" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                  Privacy Policy
                </a>
                . I consent to the processing of my financial data.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              id="register-submit-btn"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2.5 py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#070913] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/6">
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs text-slate-600">Your data is encrypted and never shared with third parties</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
