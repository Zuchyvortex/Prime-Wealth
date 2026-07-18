"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  ShieldCheck, ShieldAlert, Clock, AlertTriangle, Search, Filter,
  Check, X, FileText, Loader2, Maximize2, RotateCw, ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, ExternalLink, RefreshCw, User
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminKYCManagementPage() {
  const { data: verifications, error, mutate } = useSWR("/api/admin/verifications", fetcher);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Selection states
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  
  // Action states
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionType, setActionType] = useState<"reject" | "resubmit" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Document preview states
  const [activeDocTab, setActiveDocTab] = useState<"front" | "back" | "selfie">("front");
  const [zoom, setZoom] = useState(1);
  const [rotateDeg, setRotateDeg] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const handleAction = async (verificationId: string, action: "approve" | "reject" | "resubmit") => {
    if ((action === "reject" || action === "resubmit") && (!rejectionReason || rejectionReason.trim() === "")) {
      setFeedback({ type: "error", message: `Please provide a reason for ${action === "reject" ? "rejection" : "resubmission"}.` });
      return;
    }

    setActionLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const res = await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId,
          action,
          rejectionReason: (action === "reject" || action === "resubmit") ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setFeedback({
        type: "success",
        message: `KYC request successfully ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "requested for resubmission"}.`,
      });

      // Reset states
      setActionType(null);
      setRejectionReason("");
      setShowReviewModal(false);
      setSelectedVerification(null);
      mutate();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to submit decision." });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1 w-fit">
            <ShieldCheck className="w-4 h-4" /> Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1 w-fit">
            <ShieldAlert className="w-4 h-4" /> Rejected
          </span>
        );
      case "Request Resubmission":
        return (
          <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold flex items-center gap-1 w-fit">
            <RefreshCw className="w-4 h-4" /> Resubmit
          </span>
        );
      case "Pending Review":
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-bold flex items-center gap-1 w-fit animate-pulse">
            <Clock className="w-4 h-4" /> Pending
          </span>
        );
    }
  };

  const openReviewModal = (v: any) => {
    setSelectedVerification(v);
    setShowReviewModal(true);
    setZoom(1);
    setRotateDeg(0);
    setActiveDocTab("front");
    setActionType(null);
    setRejectionReason("");
  };

  const resetDocControls = () => {
    setZoom(1);
    setRotateDeg(0);
  };

  const getActiveDocUrl = () => {
    if (!selectedVerification) return null;
    if (activeDocTab === "front") return selectedVerification.idFrontUrl;
    if (activeDocTab === "back") return selectedVerification.idBackUrl;
    if (activeDocTab === "selfie") return selectedVerification.selfieUrl;
    return null;
  };

  if (error) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-2xl text-red-400 text-sm">
        Failed to fetch KYC submissions list. Please check authorization.
      </div>
    );
  }

  if (!verifications) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Filter and Search logic
  const filteredList = verifications.filter((v: any) => {
    const user = v.user || {};
    const nameMatch = v.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const idMatch = v.idNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const queryMatch = nameMatch || emailMatch || idMatch;
    
    if (statusFilter === "All") return queryMatch;
    return queryMatch && v.verificationStatus === statusFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            KYC Verification Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Perform compliance audits, preview legal documents, and approve or reject user identity requests.
          </p>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {feedback.message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {feedback.type === "success" ? (
            <ShieldCheck className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <div className="flex-1">{feedback.message}</div>
          <button onClick={() => setFeedback({ type: "", message: "" })} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* SEARCH AND FILTERS ROW */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by full name, email, or ID number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-5 h-5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-[#090c16] border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-purple-500 shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Request Resubmission">Request Resubmission</option>
          </select>
        </div>
      </div>

      {/* KYC DATA TABLE */}
      <div className="bg-[#090c16] border border-white/5 rounded-2xl overflow-x-auto shadow-lg">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#0b0f1b] border-b border-white/5 text-xs text-slate-400 uppercase tracking-wider">
              <th className="p-4 font-bold">User</th>
              <th className="p-4 font-bold">Location</th>
              <th className="p-4 font-bold">ID Details</th>
              <th className="p-4 font-bold">Submitted Date</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-500">
                  No verification requests found matching current filters.
                </td>
              </tr>
            ) : (
              filteredList.map((v: any) => {
                const user = v.user || {};
                return (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30 overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-purple-400 font-bold text-sm">
                              {v.fullName.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{v.fullName}</p>
                          <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                          <p className="text-[10px] text-purple-400 font-mono mt-0.5">ID: {v.userId.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-300 font-medium">{v.country}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-200 font-bold">{v.idType}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{v.idNumber}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-300">
                        {v.submittedAt ? new Date(v.submittedAt).toLocaleDateString() : "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(v.verificationStatus)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openReviewModal(v)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" /> Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FULL SCREEN REVIEW MODAL */}
      {showReviewModal && selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md" onClick={() => !actionType && setShowReviewModal(false)} />
          
          <div className={`bg-[#0b0f1b] w-full h-full sm:h-auto sm:max-h-[95vh] sm:rounded-2xl border border-white/10 shadow-2xl z-10 flex flex-col relative animate-[zoomIn_0.2s_ease-out] ${isFullscreen ? 'sm:max-w-full sm:max-h-screen sm:rounded-none' : 'max-w-6xl'}`}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/5 bg-[#090c16]">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-3">
                  KYC Submission Review
                  {getStatusBadge(selectedVerification.verificationStatus)}
                </h2>
                <p className="text-xs text-slate-400 mt-1">Review documents and approve or reject the submission.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors hidden sm:block"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              
              {/* Left Side: Information */}
              <div className="w-full lg:w-[400px] border-r border-white/5 bg-[#090c16] flex flex-col h-full shrink-0">
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Applicant Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Full Name</span>
                      <span className="text-sm font-bold text-white">{selectedVerification.fullName}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Email Address</span>
                      <span className="text-sm font-semibold text-slate-300 font-mono">{selectedVerification.user?.email}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Phone Number</span>
                        <span className="text-sm font-semibold text-slate-300">{selectedVerification.phoneNumber}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Date of Birth</span>
                        <span className="text-sm font-semibold text-slate-300">
                          {selectedVerification.dateOfBirth ? new Date(selectedVerification.dateOfBirth).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Nationality</span>
                        <span className="text-sm font-semibold text-slate-300">{selectedVerification.nationality}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Country</span>
                        <span className="text-sm font-semibold text-slate-300">{selectedVerification.country}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Residential Address</span>
                      <span className="text-sm font-semibold text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl block border border-white/5">
                        {selectedVerification.address}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Occupation</span>
                      <span className="text-sm font-semibold text-slate-300">{selectedVerification.occupation}</span>
                    </div>
                  </div>

                  <div className="mt-8 mb-4 border-t border-white/5 pt-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Document Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Document Type</span>
                        <span className="text-sm font-bold text-purple-400">{selectedVerification.idType}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Document Number</span>
                        <span className="text-sm font-bold text-white font-mono">{selectedVerification.idNumber}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Submission Date</span>
                        <span className="text-sm font-semibold text-slate-300">
                          {selectedVerification.submittedAt ? new Date(selectedVerification.submittedAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block mb-1">Expiry Date</span>
                        <span className="text-sm font-semibold text-slate-300">{selectedVerification.expiryDate || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                {selectedVerification.verificationStatus === "Pending Review" ? (
                  <div className="p-4 border-t border-white/5 bg-[#0b0f1b] space-y-3">
                    <button
                      onClick={() => handleAction(selectedVerification.id, "approve")}
                      disabled={actionLoading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex justify-center items-center gap-2"
                    >
                      <Check className="w-5 h-5" /> Approve Verification
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setActionType("resubmit")}
                        disabled={actionLoading}
                        className="py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" /> Request Resubmit
                      </button>
                      <button
                        onClick={() => setActionType("reject")}
                        disabled={actionLoading}
                        className="py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5"
                      >
                        <X className="w-4 h-4" /> Reject Verification
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t border-white/5 bg-white/5 text-xs text-slate-400">
                    <p>Audit Log Details:</p>
                    <p>Auditor: <strong className="text-white">{selectedVerification.reviewedBy || "System"}</strong></p>
                    <p>Date: <strong className="text-white">{selectedVerification.reviewedAt ? new Date(selectedVerification.reviewedAt).toLocaleString() : "N/A"}</strong></p>
                    {selectedVerification.rejectionReason && (
                      <p className="mt-2 text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20 leading-relaxed">
                        Reason: {selectedVerification.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Side: Document Previewer */}
              <div className="flex-1 bg-black/60 flex flex-col overflow-hidden relative">
                
                {/* Document Tabs */}
                <div className="flex p-3 gap-2 bg-[#0b0f1b]/80 backdrop-blur-md border-b border-white/5 shrink-0 z-10">
                  <button
                    onClick={() => { setActiveDocTab("front"); resetDocControls(); }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                      activeDocTab === "front" ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" /> Front ID
                  </button>
                  {selectedVerification.idBackUrl && (
                    <button
                      onClick={() => { setActiveDocTab("back"); resetDocControls(); }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                        activeDocTab === "back" ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <ImageIcon className="w-4 h-4" /> Back ID
                    </button>
                  )}
                  {selectedVerification.selfieUrl && (
                    <button
                      onClick={() => { setActiveDocTab("selfie"); resetDocControls(); }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                        activeDocTab === "selfie" ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <User className="w-4 h-4" /> Selfie
                    </button>
                  )}
                </div>

                {/* Preview Toolbar */}
                <div className="absolute top-16 right-4 z-20 flex flex-col gap-2 bg-[#090c16]/80 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-lg">
                  <button onClick={() => setZoom(z => z + 0.2)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg" title="Zoom In">
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg" title="Zoom Out">
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button onClick={() => setRotateDeg(r => r + 90)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg" title="Rotate Right">
                    <RotateCw className="w-5 h-5" />
                  </button>
                  <button onClick={() => setRotateDeg(r => r - 90)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg" title="Rotate Left">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  {getActiveDocUrl() && (
                    <a href={getActiveDocUrl()!} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg" title="Open Original">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>

                {/* Viewer Area */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-4 custom-scrollbar bg-[#0b0f1b] relative">
                  {getActiveDocUrl() ? (
                    getActiveDocUrl()!.toLowerCase().endsWith(".pdf") ? (
                      <iframe 
                        src={getActiveDocUrl()!} 
                        className="w-full h-full rounded-xl border border-white/10 shadow-2xl bg-white" 
                      />
                    ) : (
                      <div className="relative min-w-full min-h-full flex items-center justify-center overflow-hidden">
                         <img
                          src={getActiveDocUrl()!}
                          alt="Document Preview"
                          style={{
                            transform: `scale(${zoom}) rotate(${rotateDeg}deg)`,
                            transition: 'transform 0.2s ease-out'
                          }}
                          className="max-w-none shadow-2xl rounded-xl object-contain origin-center"
                        />
                      </div>
                    )
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                      <FileText className="w-16 h-16 mb-4 opacity-50" />
                      <p>Document not available.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inner Modal for Reject / Resubmit Reason */}
            {actionType && (
              <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-[#090c16] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-[zoomIn_0.2s_ease-out]">
                  <h3 className={`text-lg font-extrabold flex items-center gap-2 mb-2 ${actionType === 'reject' ? 'text-red-500' : 'text-orange-500'}`}>
                    {actionType === 'reject' ? <ShieldAlert className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
                    {actionType === 'reject' ? 'Reject Verification' : 'Request Resubmission'}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                    Provide a clear reason for the {actionType === 'reject' ? 'rejection' : 'resubmission request'}. This will be emailed directly to the user.
                  </p>
                  
                  <textarea
                    required
                    rows={4}
                    placeholder="e.g. The uploaded Driver's License has expired. Please submit a valid document."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className={`w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-${actionType === 'reject' ? 'red' : 'orange'}-500 text-sm transition-all shadow-inner`}
                  />

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => { setActionType(null); setRejectionReason(""); }}
                      className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(selectedVerification.id, actionType)}
                      disabled={actionLoading || !rejectionReason.trim()}
                      className={`px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 ${
                        actionType === 'reject' 
                          ? 'bg-red-600 hover:bg-red-500 disabled:bg-red-900/50' 
                          : 'bg-orange-600 hover:bg-orange-500 disabled:bg-orange-900/50'
                      }`}
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} 
                      Confirm {actionType === 'reject' ? 'Rejection' : 'Resubmission'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}} />
    </div>
  );
}
