"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Shield, Bell, CheckCircle, AlertCircle,
  Camera, Upload, Sun, Moon, Monitor, Palette, X
} from "lucide-react";
import { useTheme } from "next-themes";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function SettingsPage() {
  const { data: currentUser, mutate } = useSWR("/api/user/profile", fetcher);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [job, setJob] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "appearance">("profile");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
      setJob(currentUser.job || "");
      setAvatarPreview(currentUser.avatar || null);
    }
  }, [currentUser]);

  const uploadToCloudinary = async (file: File) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET || CLOUD_NAME === "your_cloudinary_cloud_name") {
      setFeedback({ type: "error", message: "Image upload is temporarily unavailable. Please try again later." });
      return;
    }

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFeedback({ type: "error", message: `File is too large. Max size is ${MAX_SIZE_MB}MB.` });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setFeedback({ type: "error", message: "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed." });
      return;
    }

    setAvatarUploading(true);
    setFeedback({ type: "", message: "" });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "prime-wealth/avatars");

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.secure_url) {
        setAvatarPreview(data.secure_url);
        // Save URL to database
        const patchRes = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: data.secure_url }),
        });
        if (patchRes.ok) {
          setFeedback({ type: "success", message: "Profile picture updated successfully." });
          mutate();
        } else {
          setFeedback({ type: "error", message: "Failed to save avatar to profile." });
        }
      } else {
        setFeedback({ type: "error", message: data.error?.message || "Upload failed." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error during upload. Please try again." });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (file) uploadToCloudinary(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    if (!name) { setFeedback({ type: "error", message: "Name is required." }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, job }),
      });
      if (res.ok) {
        setFeedback({ type: "success", message: "Profile successfully saved." });
        mutate();
      } else {
        const data = await res.json();
        setFeedback({ type: "error", message: data.error || "Failed to update profile." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    if (!currentPw || !newPw || !confirmNewPw) { setFeedback({ type: "error", message: "Please fill in all password fields." }); return; }
    if (newPw !== confirmNewPw) { setFeedback({ type: "error", message: "New passwords do not match." }); return; }
    if (newPw.length < 6) { setFeedback({ type: "error", message: "Password must be at least 6 characters." }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      if (res.ok) {
        setFeedback({ type: "success", message: "Password successfully updated." });
        setCurrentPw(""); setNewPw(""); setConfirmNewPw("");
      } else {
        const data = await res.json();
        setFeedback({ type: "error", message: data.error || "Failed to update password." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const avatarFallback = currentUser?.name?.charAt(0)?.toUpperCase() || "U";

  const themeOptions = [
    { id: "dark", label: "Dark Mode", desc: "Premium dark fintech interface", icon: <Moon className="w-5 h-5" /> },
    { id: "light", label: "Light Mode", desc: "Clean professional light interface", icon: <Sun className="w-5 h-5" /> },
    { id: "system", label: "System Default", desc: "Follows your OS preference", icon: <Monitor className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Customize your profile, configure security keys, and manage appearance.</p>
      </div>

      {/* FEEDBACK */}
      <AnimatePresence>
        {feedback.message && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback({ type: "", message: "" })} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB SELECTORS */}
      <div className="flex border-b border-[var(--glass-border)] space-x-1 text-sm font-semibold overflow-x-auto">
        {[
          { id: "profile", label: "Profile Info", icon: <User className="w-4 h-4" /> },
          { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" /> },
          { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setFeedback({ type: "", message: "" }); }}
            className={`pb-4 px-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? "border-brand-emerald text-brand-emerald" : "border-transparent text-slate-500 hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">{tab.icon} {tab.label}</span>
          </button>
        ))}
      </div>

      {/* ===== PROFILE TAB ===== */}
      {activeTab === "profile" && (
        <div className="space-y-6 max-w-2xl">
          {/* AVATAR UPLOADER */}
          <div className="glass rounded-2xl p-6 border border-[var(--glass-border)]">
            <h4 className="text-sm font-bold text-foreground mb-4">Profile Picture</h4>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar preview */}
              <div className="relative shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-brand-emerald/30 shadow-lg shadow-brand-emerald/10" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-neon flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                    {avatarFallback}
                  </div>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-neon rounded-full flex items-center justify-center text-white shadow-md hover:brightness-110 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Drag and drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-brand-emerald bg-brand-emerald/10"
                    : "border-[var(--glass-border)] hover:border-brand-emerald/50 hover:bg-white/5"
                }`}
              >
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Drop your image here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse — JPG, PNG, WEBP up to 5MB</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* PROFILE FORM */}
          <div className="glass rounded-2xl p-6 border border-[var(--glass-border)]">
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <h4 className="text-sm font-bold text-foreground">Personal Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email Address (Immutable)</label>
                  <input type="email" disabled value={currentUser?.email || ""}
                    className="w-full px-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-slate-500 text-sm cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Profession / Job Title</label>
                  <input type="text" value={job} onChange={(e) => setJob(e.target.value)} placeholder="Private Equity Analyst"
                    className="w-full px-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="px-6 py-2.5 bg-gradient-neon text-[#022c22] rounded-xl text-sm font-semibold hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-md disabled:opacity-50">
                  {loading ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== APPEARANCE TAB ===== */}
      {activeTab === "appearance" && mounted && (
        <div className="space-y-6 max-w-2xl">
          <div className="glass rounded-2xl p-6 border border-[var(--glass-border)]">
            <h4 className="text-sm font-bold text-foreground mb-1">Theme Preference</h4>
            <p className="text-xs text-slate-500 mb-5">Choose how Prime Wealth looks for you. Your preference is saved automatically.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    theme === option.id
                      ? "border-brand-emerald bg-brand-emerald/10"
                      : "border-[var(--glass-border)] hover:border-brand-emerald/40 bg-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className={`mb-3 w-10 h-10 rounded-xl flex items-center justify-center ${theme === option.id ? "bg-gradient-neon text-[#022c22]" : "bg-white/10 text-slate-400"}`}>
                    {option.icon}
                  </div>
                  <p className="text-sm font-bold text-foreground">{option.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                  {theme === option.id && (
                    <div className="mt-3 flex items-center gap-1.5 text-brand-emerald">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== SECURITY TAB ===== */}
      {activeTab === "security" && (
        <div className="glass rounded-2xl p-6 max-w-2xl border border-[var(--glass-border)]">
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <h4 className="text-sm font-bold text-foreground">Password Authentication</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
              <input type="password" required value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                <input type="password" required value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input type="password" required value={confirmNewPw} onChange={(e) => setConfirmNewPw(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 bg-gradient-neon text-[#022c22] rounded-xl text-sm font-semibold hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-md disabled:opacity-50">
                {loading ? "Updating..." : "Change Access Key"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
