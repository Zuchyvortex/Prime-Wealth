"use client";

import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, CheckCircle2, Clock, AlertTriangle,
  Upload, FileText, User, Calendar, Globe, MapPin, Phone,
  Briefcase, CreditCard, Loader2, ArrowLeftRight, ChevronRight,
  Info, Eye, Trash2
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ID_TYPES = [
  "Passport",
  "Driver's License",
  "National ID Card",
  "Voter ID",
  "Residence Permit",
  "Other government-issued photo ID"
];

export default function KYCVerificationPage() {
  const { data: currentUser, error, mutate } = useSWR("/api/user/profile", fetcher);
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [occupation, setOccupation] = useState("");
  const [idType, setIdType] = useState("Passport");
  const [idNumber, setIdNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Upload URLs and uploading states
  const [idFrontUrl, setIdFrontUrl] = useState("");
  const [idBackUrl, setIdBackUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");

  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fileFrontRef = useRef<HTMLInputElement>(null);
  const fileBackRef = useRef<HTMLInputElement>(null);
  const fileSelfieRef = useRef<HTMLInputElement>(null);

  // Pre-fill form if rejected or existing verification exists
  useEffect(() => {
    if (currentUser && currentUser.verification) {
      const v = currentUser.verification;
      setFullName(v.fullName || "");
      if (v.dateOfBirth) {
        setDateOfBirth(new Date(v.dateOfBirth).toISOString().split("T")[0]);
      }
      setNationality(v.nationality || "");
      setCountry(v.country || "");
      setAddress(v.address || "");
      setPhoneNumber(v.phoneNumber || "");
      setOccupation(v.occupation || "");
      setIdType(v.idType || "Passport");
      setIdNumber(v.idNumber || "");
      setExpiryDate(v.expiryDate || "");
      setIdFrontUrl(v.idFrontUrl || "");
      setIdBackUrl(v.idBackUrl || "");
      setSelfieUrl(v.selfieUrl || "");
    } else if (currentUser) {
      setFullName(currentUser.name || "");
      setPhoneNumber(currentUser.phone || "");
      setOccupation(currentUser.job || "");
    }
  }, [currentUser]);

  // Asynchronous Cloudinary document upload helper
  const handleFileUpload = async (file: File, type: "front" | "back" | "selfie") => {
    // 10 MB limit
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFeedback({ type: "error", message: "File exceeds 10MB limit." });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({ type: "error", message: "Invalid file type. Only JPG, JPEG, PNG, and PDF are allowed." });
      return;
    }

    if (type === "front") setUploadingFront(true);
    if (type === "back") setUploadingBack(true);
    if (type === "selfie") setUploadingSelfie(true);
    setFeedback({ type: "", message: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        throw new Error(`Upload failed. Server responded with status ${res.status}: ${text.substring(0, 100) || "Unknown error"}`);
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to upload file");
      }

      if (type === "front") setIdFrontUrl(data.url);
      if (type === "back") setIdBackUrl(data.url);
      if (type === "selfie") setSelfieUrl(data.url);

      setFeedback({ type: "success", message: "Document uploaded successfully!" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "File upload failed. Please try again." });
    } finally {
      if (type === "front") setUploadingFront(false);
      if (type === "back") setUploadingBack(false);
      if (type === "selfie") setUploadingSelfie(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    if (
      !fullName ||
      !dateOfBirth ||
      !nationality ||
      !country ||
      !address ||
      !phoneNumber ||
      !occupation ||
      !idType ||
      !idNumber ||
      !idFrontUrl
    ) {
      setFeedback({ type: "error", message: "Please complete all fields and upload the front of your ID." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/user/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          dateOfBirth,
          nationality,
          country,
          address,
          phoneNumber,
          occupation,
          idType,
          idNumber,
          expiryDate,
          idFrontUrl,
          idBackUrl,
          selfieUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit verification request");
      }

      setFeedback({ type: "success", message: "Verification request submitted successfully!" });
      mutate();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Submission failed. Please check your data." });
    } finally {
      setLoading(false);
    }
  };

  // Determine user KYC status from user object
  const userStatus = currentUser?.status || "UNVERIFIED";
  const verification = currentUser?.verification;
  const verificationStatus = verification?.verificationStatus || "Not Submitted";

  if (!currentUser) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-emerald animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Identity Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete KYC (Know Your Customer) compliance to unlock advanced wealth trading and dynamic yields.
        </p>
      </div>

      {/* FEEDBACK SYSTEM */}
      <AnimatePresence>
        {feedback.message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <div className="flex-1">{feedback.message}</div>
            <button
              onClick={() => setFeedback({ type: "", message: "" })}
              className="p-1 hover:bg-white/5 rounded"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW 1: APPROVED STATE */}
      {userStatus === "VERIFIED" && verificationStatus === "Approved" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-premium rounded-2xl p-8 border border-emerald-500/30 text-center relative overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-9 h-9" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Identity Verified Successfully
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
            Your identity has been fully verified by our compliance desk. Your Prime Wealth vault has been unlocked, and you now have unrestricted access to premium allocations.
          </p>

          <div className="mt-8 max-w-lg mx-auto bg-white/3 border border-white/5 rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Verification details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Full Name</span>
                <span className="font-semibold text-white">{verification?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Nationality</span>
                <span className="font-semibold text-white">{verification?.nationality}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Document Type</span>
                <span className="font-semibold text-white">{verification?.idType}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Document Number</span>
                <span className="font-semibold text-white">{verification?.idNumber}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block mb-0.5">Residential Address</span>
                <span className="font-semibold text-white leading-normal">{verification?.address}, {verification?.country}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW 2: PENDING REVIEW STATE */}
      {verificationStatus === "Pending Review" && userStatus !== "VERIFIED" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 border border-blue-500/20 text-center relative overflow-hidden"
        >
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Clock className="w-9 h-9 animate-[pulse_2s_infinite]" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Verification Under Review
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
            Your verification documents have been received and are currently under review by our compliance team. Reviews are completed within 24 to 48 hours.
          </p>

          <div className="mt-8 max-w-lg mx-auto bg-white/3 border border-white/5 rounded-2xl p-6 text-left space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">
              Submitted Profile Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Full Name</span>
                <span className="font-semibold text-white">{verification?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Document Type</span>
                <span className="font-semibold text-white">{verification?.idType}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Document Number</span>
                <span className="font-semibold text-white">{verification?.idNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Submission Date</span>
                <span className="font-semibold text-white">
                  {verification?.submittedAt ? new Date(verification.submittedAt).toLocaleDateString() : "Today"}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW 3: SUBMISSION FORM (NOT SUBMITTED OR REJECTED) */}
      {(verificationStatus === "Not Submitted" || verificationStatus === "Rejected" || userStatus === "REJECTED") && (
        <div className="space-y-6">
          
          {/* REJECTION BANNER */}
          {verificationStatus === "Rejected" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-red-500/10 border-l-4 border-red-500 rounded-r-xl text-xs flex gap-4"
            >
              <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h4 className="font-bold text-red-400 text-sm">Identity Verification Rejected</h4>
                <p className="text-slate-300 mt-1 leading-relaxed">
                  Reason for rejection: <span className="text-white font-semibold underline">{verification?.rejectionReason}</span>
                </p>
                <p className="text-slate-400 mt-1 leading-normal">
                  Please review the details below, correct any mistakes, re-upload clear copies of your documents, and submit again.
                </p>
              </div>
            </motion.div>
          )}

          {/* DOCUMENT FORM */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            
            {/* Section A: Personal Details */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-[var(--glass-border)] pb-3.5">
                <div className="w-7 h-7 bg-brand-emerald/10 text-brand-emerald rounded-lg flex items-center justify-center font-bold text-xs">1</div>
                <h3 className="text-sm font-bold text-foreground">Personal Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name (Matching Document)</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="date" required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground focus:outline-none focus:border-brand-emerald text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nationality</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" required value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="United States"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Country of Residence</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" required value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United Kingdom"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Residential Address</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Financial District Way, London"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+44 7911 123456"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Occupation</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" required value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Fintech Executive"
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                </div>
              </div>
            </div>

            {/* Section B: Document Details */}
            <div className="glass rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-[var(--glass-border)] pb-3.5">
                <div className="w-7 h-7 bg-brand-emerald/10 text-brand-emerald rounded-lg flex items-center justify-center font-bold text-xs">2</div>
                <h3 className="text-sm font-bold text-foreground">Document Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">ID Document Type</label>
                  <select value={idType} onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#070913] border border-[var(--glass-border)] rounded-xl text-foreground focus:outline-none focus:border-brand-emerald text-sm">
                    {ID_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-background text-foreground">{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">ID Number</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" required value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="AB123456C"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground placeholder-slate-500 focus:outline-none focus:border-brand-emerald text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Expiry Date (if applicable)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-[var(--glass-border)] rounded-xl text-foreground focus:outline-none focus:border-brand-emerald text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Document Uploads */}
            <div className="glass rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-[var(--glass-border)] pb-3.5">
                <div className="w-7 h-7 bg-brand-emerald/10 text-brand-emerald rounded-lg flex items-center justify-center font-bold text-xs">3</div>
                <h3 className="text-sm font-bold text-foreground">Upload Documents</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* 1. FRONT OF ID */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Front of ID *
                  </span>
                  
                  <div
                    onClick={() => fileFrontRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all min-h-[160px] flex flex-col justify-center items-center ${
                      idFrontUrl
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-[var(--glass-border)] hover:border-brand-emerald/50 hover:bg-white/5"
                    }`}
                  >
                    {uploadingFront ? (
                      <Loader2 className="w-7 h-7 text-brand-emerald animate-spin" />
                    ) : idFrontUrl ? (
                      <div className="space-y-2">
                        <FileText className="w-8 h-8 text-emerald-400 mx-auto" />
                        <span className="text-[10px] text-emerald-400 font-semibold block truncate max-w-[150px]">
                          Front Loaded ✔
                        </span>
                        <span className="text-[9px] text-slate-500 hover:text-red-400 flex items-center justify-center gap-1 mt-1" onClick={(e) => { e.stopPropagation(); setIdFrontUrl(""); }}>
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-white">Front photo / PDF</p>
                        <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                          Click to browse (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileFrontRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "front");
                    }}
                  />
                </div>

                {/* 2. BACK OF ID */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Back of ID (Optional)
                  </span>

                  <div
                    onClick={() => fileBackRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all min-h-[160px] flex flex-col justify-center items-center ${
                      idBackUrl
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-[var(--glass-border)] hover:border-brand-emerald/50 hover:bg-white/5"
                    }`}
                  >
                    {uploadingBack ? (
                      <Loader2 className="w-7 h-7 text-brand-emerald animate-spin" />
                    ) : idBackUrl ? (
                      <div className="space-y-2">
                        <FileText className="w-8 h-8 text-emerald-400 mx-auto" />
                        <span className="text-[10px] text-emerald-400 font-semibold block truncate max-w-[150px]">
                          Back Loaded ✔
                        </span>
                        <span className="text-[9px] text-slate-500 hover:text-red-400 flex items-center justify-center gap-1 mt-1" onClick={(e) => { e.stopPropagation(); setIdBackUrl(""); }}>
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-white">Back photo / PDF</p>
                        <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                          Click to browse (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileBackRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "back");
                    }}
                  />
                </div>

                {/* 3. SELFIE WITH ID */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Selfie holding ID (Optional)
                  </span>

                  <div
                    onClick={() => fileSelfieRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all min-h-[160px] flex flex-col justify-center items-center ${
                      selfieUrl
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-[var(--glass-border)] hover:border-brand-emerald/50 hover:bg-white/5"
                    }`}
                  >
                    {uploadingSelfie ? (
                      <Loader2 className="w-7 h-7 text-brand-emerald animate-spin" />
                    ) : selfieUrl ? (
                      <div className="space-y-2">
                        <FileText className="w-8 h-8 text-emerald-400 mx-auto" />
                        <span className="text-[10px] text-emerald-400 font-semibold block truncate max-w-[150px]">
                          Selfie Loaded ✔
                        </span>
                        <span className="text-[9px] text-slate-500 hover:text-red-400 flex items-center justify-center gap-1 mt-1" onClick={(e) => { e.stopPropagation(); setSelfieUrl(""); }}>
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-7 h-7 text-slate-500 mx-auto mb-2" />
                        <p className="text-xs font-bold text-white">Selfie holding ID</p>
                        <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                          Click to browse (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileSelfieRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "selfie");
                    }}
                  />
                </div>

              </div>

              <div className="flex items-start gap-2.5 p-3.5 bg-white/3 border border-white/5 rounded-xl text-[10px] text-slate-400 leading-normal">
                <Info className="w-4.5 h-4.5 text-brand-emerald shrink-0 mt-0.5" />
                <p>
                  Identity documents are encrypted and handled in absolute compliance with global financial data protection guidelines. Files must be sharp and easily readable. Only PDF, JPG, JPEG, and PNG formats are supported (Max size 10MB).
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || uploadingFront || uploadingBack || uploadingSelfie || !idFrontUrl}
                className="px-8 py-3 bg-gradient-neon text-[#022c22] rounded-xl text-sm font-bold shadow-lg hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                  </>
                ) : (
                  <>
                    Submit Identity Verification <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
}
