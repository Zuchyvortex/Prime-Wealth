"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";
import { signIn, useSession } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in as admin
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (session.user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        // Regular users cannot access admin routes
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
        setError("Invalid administrator credentials. Access denied.");
        setIsLoading(false);
      } else if (result?.ok) {
        // Successful sign-in — hard redirect to admin dashboard.
        // The middleware will enforce the admin role check server-side.
        // If the logged-in user is not an admin, middleware redirects them to /dashboard.
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
        <span className="w-8 h-8 border-2 border-white/20 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-900/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-900/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-800/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-purple-blue p-0.5">
            <div className="w-full h-full bg-[#070913] rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Prime<span className="text-purple-400">Admin</span>
          </span>
        </Link>

        {/* Restricted Access Badge */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Restricted Access</span>
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Administrator Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          This area is restricted to authorized system administrators only.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0"
      >
        <div className="bg-[#090c16] border border-white/8 p-8 rounded-2xl relative overflow-hidden shadow-2xl">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-950/50 border border-red-500/30 rounded-xl text-sm text-red-200 flex items-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              {error}
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-slate-300">
                Administrator Email
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="admin@primewealth.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-slate-300">
                Admin Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-purple-blue hover:brightness-110 active:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-[#090c16] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Access System Console <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security notice */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest">
              🔒 All access attempts are logged and monitored
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          Not an administrator?{" "}
          <Link href="/login" className="text-purple-500 hover:text-purple-400 transition-colors font-medium">
            Return to user login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
