"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  ShieldCheck, ShieldAlert, Clock, AlertTriangle, Search, Filter,
  Eye, Check, X, FileText, Loader2, ArrowLeftRight, User, Mail,
  Calendar, MapPin, Globe, Briefcase, Phone, CreditCard, ChevronRight,
  ExternalLink, Maximize2
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminKYCManagementPage() {
  const { data: verifications, error, mutate } = useSWR("/api/admin/verifications", fetcher);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Selection states
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const handleAction = async (verificationId: string, action: "approve" | "reject") => {
    if (action === "reject" && (!rejectionReason || rejectionReason.trim() === "")) {
      setFeedback({ type: "error", message: "Please provide a rejection reason." });
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
          rejectionReason: action === "reject" ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setFeedback({
        type: "success",
        message: `KYC request successfully ${action === "approve" ? "approved" : "rejected"}.`,
      });

      // Reset states
      setShowRejectModal(false);
      setRejectionReason("");
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
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold flex items-center gap-1 w-fit">
            <ShieldAlert className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case "Pending Review":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-bold flex items-center gap-1 w-fit animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
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
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
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
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by full name, email, or ID number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#090c16] border border-white/10 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* REQUESTS LIST COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#090c16] border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 bg-[#0b0f1b]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Identity submissions ({filteredList.length})
              </h3>
            </div>
            
            {filteredList.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">No verification requests found matching current filters.</p>
            ) : (
              <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                {filteredList.map((v: any) => {
                  const user = v.user || {};
                  const isSelected = selectedVerification?.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => { setSelectedVerification(v); setFeedback({ type: "", message: "" }); }}
                      className={`p-5 hover:bg-white/3 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected ? "bg-purple-500/5 border-l-4 border-purple-500" : ""
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{v.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({user.email})</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>Doc: <strong className="text-slate-200">{v.idType}</strong></span>
                          <span>No: <strong className="text-slate-200 font-mono">{v.idNumber}</strong></span>
                        </div>
                        <span className="text-[9px] text-slate-500 block font-mono">
                          Submitted: {v.submittedAt ? new Date(v.submittedAt).toLocaleString() : "N/A"}
                        </span>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-2">
                        {getStatusBadge(v.verificationStatus)}
                        <ChevronRight className="w-4.5 h-4.5 text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DETAILS PANEL COLUMN */}
        <div className="lg:col-span-1">
          {selectedVerification ? (
            <div className="bg-[#090c16] border border-white/5 rounded-2xl p-6 space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="flex justify-between items-start border-b border-white/5 pb-4">
                <div>
                  <h3 className="font-extrabold text-white text-base">{selectedVerification.fullName}</h3>
                  <span className="text-[10px] font-mono text-purple-400 block mt-0.5">
                    User Ref: {selectedVerification.userId.substring(0, 8)}...
                  </span>
                </div>
                <button
                  onClick={() => setSelectedVerification(null)}
                  className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Header */}
              <div className="flex justify-between items-center bg-white/3 p-3 rounded-xl border border-white/5 text-xs">
                <span className="text-slate-400">Current Status:</span>
                {getStatusBadge(selectedVerification.verificationStatus)}
              </div>

              {/* Personal Details */}
              <div className="space-y-3.5 text-xs">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Submitted Details</h4>
                <div className="grid grid-cols-2 gap-3 bg-white/3 p-4 rounded-xl border border-white/5">
                  <div className="col-span-2">
                    <span className="text-slate-500 block mb-0.5">Email</span>
                    <span className="font-semibold text-white font-mono">{selectedVerification.user?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Date of Birth</span>
                    <span className="font-semibold text-white">
                      {selectedVerification.dateOfBirth ? new Date(selectedVerification.dateOfBirth).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Nationality</span>
                    <span className="font-semibold text-white">{selectedVerification.nationality}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Country</span>
                    <span className="font-semibold text-white">{selectedVerification.country}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Phone</span>
                    <span className="font-semibold text-white">{selectedVerification.phoneNumber}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block mb-0.5">Residential Address</span>
                    <span className="font-semibold text-white leading-normal">{selectedVerification.address}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Occupation</span>
                    <span className="font-semibold text-white">{selectedVerification.occupation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Expiry Date</span>
                    <span className="font-semibold text-white">{selectedVerification.expiryDate || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Document Previews */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Uploaded Files</h4>
                <div className="space-y-2">
                  
                  {/* Front of ID Link */}
                  {selectedVerification.idFrontUrl && (
                    <div className="flex items-center justify-between p-3 bg-[#0b0f1b] border border-white/5 rounded-xl hover:border-purple-500/30 transition-all">
                      <span className="text-slate-300 font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" /> Front of ID
                      </span>
                      <button
                        onClick={() => setPreviewDocUrl(selectedVerification.idFrontUrl)}
                        className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" /> Preview
                      </button>
                    </div>
                  )}

                  {/* Back of ID Link */}
                  {selectedVerification.idBackUrl && (
                    <div className="flex items-center justify-between p-3 bg-[#0b0f1b] border border-white/5 rounded-xl hover:border-purple-500/30 transition-all">
                      <span className="text-slate-300 font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" /> Back of ID
                      </span>
                      <button
                        onClick={() => setPreviewDocUrl(selectedVerification.idBackUrl)}
                        className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" /> Preview
                      </button>
                    </div>
                  )}

                  {/* Selfie Link */}
                  {selectedVerification.selfieUrl && (
                    <div className="flex items-center justify-between p-3 bg-[#0b0f1b] border border-white/5 rounded-xl hover:border-purple-500/30 transition-all">
                      <span className="text-slate-300 font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400" /> Selfie holding ID
                      </span>
                      <button
                        onClick={() => setPreviewDocUrl(selectedVerification.selfieUrl)}
                        className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" /> Preview
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Action Buttons */}
              {selectedVerification.verificationStatus === "Pending Review" && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleAction(selectedVerification.id, "approve")}
                    disabled={actionLoading}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <Check className="w-4 h-4" /> Approve KYC
                  </button>
                  <button
                    onClick={() => { setShowRejectModal(true); setFeedback({ type: "", message: "" }); }}
                    disabled={actionLoading}
                    className="py-2.5 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <X className="w-4 h-4" /> Reject KYC
                  </button>
                </div>
              )}

              {/* Details for reviewed KYC */}
              {selectedVerification.verificationStatus !== "Pending Review" && (
                <div className="bg-white/3 p-4 rounded-xl border border-white/5 text-xs text-slate-400 space-y-1">
                  <p>Audit Log Details:</p>
                  <p>Auditor: <strong className="text-white">{selectedVerification.reviewedBy || "System"}</strong></p>
                  <p>Date: <strong className="text-white">{selectedVerification.reviewedAt ? new Date(selectedVerification.reviewedAt).toLocaleString() : "N/A"}</strong></p>
                  {selectedVerification.rejectionReason && (
                    <p className="mt-2 text-red-400 bg-red-500/5 p-2 rounded border border-red-500/10 leading-normal">
                      Rejection Reason: {selectedVerification.rejectionReason}
                    </p>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-[#090c16] border border-white/5 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Select a verification submission from the queue to run an audit.
            </div>
          )}
        </div>

      </div>

      {/* REJECTION MODAL */}
      {showRejectModal && selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRejectModal(false)} />
          <div className="bg-[#090c16] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 z-10 animate-[zoomIn_0.2s_ease-out]">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Provide Rejection Reason
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              State why the documents for <strong className="text-white">{selectedVerification.fullName}</strong> were rejected. This explanation will be sent directly to the user to guide their resubmission.
            </p>

            <textarea
              required
              rows={4}
              placeholder="e.g. The uploaded Driver's License has expired. Please submit a valid document."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-red-500 text-xs transition-all"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold rounded-xl text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(selectedVerification.id, "reject")}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-bold rounded-xl text-white disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null} Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewDocUrl(null)} />
          <div className="bg-[#090c16] border border-white/10 rounded-2xl max-w-3xl w-full p-5 space-y-4 z-10 relative animate-[zoomIn_0.2s_ease-out]">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Document preview</h4>
              <div className="flex items-center gap-3">
                <a
                  href={previewDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </a>
                <button
                  onClick={() => setPreviewDocUrl(null)}
                  className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="border border-white/5 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center min-h-[300px] max-h-[70vh]">
              {previewDocUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewDocUrl} className="w-full h-[60vh]" />
              ) : (
                <img
                  src={previewDocUrl}
                  alt="Identity Document Preview"
                  className="max-w-full max-h-[65vh] object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
