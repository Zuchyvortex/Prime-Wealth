"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import Pusher from "pusher-js";
import { Send, MessageSquare, ShieldCheck, LifeBuoy } from "lucide-react";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ClientSupportPage() {
  const { data: session } = useSession();
  const { data: currentUser } = useSWR("/api/user/profile", fetcher);
  const { data: messages, mutate } = useSWR("/api/chat/messages", fetcher, {
    refreshInterval: 3000 // Fallback polling if Pusher fails
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Pusher real-time trigger
  useEffect(() => {
    if (!currentUser?.id) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || "dummy_key";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true
    });

    const channel = pusher.subscribe(`chat-${currentUser.id}`);
    
    channel.bind("new-message", (newMessage: any) => {
      mutate((current: any) => {
        if (!current) return [newMessage];
        // Prevent duplicate appending if SWR already polled it
        if (current.some((m: any) => m.id === newMessage.id)) return current;
        return [...current, newMessage];
      }, false);
    });

    return () => {
      pusher.unsubscribe(`chat-${currentUser.id}`);
      pusher.disconnect();
    };
  }, [currentUser?.id, mutate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    const content = inputMessage.trim();
    setInputMessage("");

    // Optimistic UI update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      sender: currentUser?.name || currentUser?.email || "User",
      createdAt: new Date().toISOString()
    };
    mutate((current: any) => [...(current || []), tempMsg], false);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        mutate(); // Revalidate to fetch actual message object
      }
    } catch (err) {
      console.error("Failed to send support message:", err);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">
      {/* Support Header */}
      <div className="flex items-center justify-between p-4 border border-white/5 rounded-t-2xl bg-[#090c16]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <LifeBuoy className="w-5 h-5 text-purple-400 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Live Support Room</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium font-sans">
                Financial Operations Desk (Active)
              </span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Encrypted Session</span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 border-x border-white/5 bg-[#070913]/60 scrollbar-thin">
        {messages && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-350">No Messages Yet</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
              Initiate contact by typing your inquiry below. Our financial operations agents are standing by.
            </p>
          </div>
        ) : (
          messages?.map((msg: any) => {
            const isUser = !msg.sender.startsWith("Support:");
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? "bg-gradient-purple-blue text-white rounded-tr-none"
                      : "bg-white/5 border border-white/10 text-slate-250 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-slate-500 font-mono">
                  <span>{msg.sender}</span>
                  <span>•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-3 p-4 border border-white/5 rounded-b-2xl bg-[#090c16]"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Describe your deposit, withdrawal, or yield inquiry..."
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-purple-500 text-sm font-sans"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isSending}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-purple-blue text-white hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
}
