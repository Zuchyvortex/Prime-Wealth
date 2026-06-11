"use client";

import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import Pusher from "pusher-js";
import { Send, MessageSquare, User, ShieldCheck, CornerDownLeft } from "lucide-react";
import { motion } from "framer-motion";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminChatPage() {
  const { data: rooms, mutate: mutateRooms } = useSWR("/api/chat/rooms", fetcher, {
    refreshInterval: 4000 // Poll rooms list
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages for selected room
  const { data: messages, mutate: mutateMessages } = useSWR(
    selectedUserId ? `/api/chat/messages?userId=${selectedUserId}` : null,
    fetcher,
    {
      refreshInterval: 2500 // Poll messages history of active room
    }
  );

  const selectedRoom = rooms?.find((r: any) => r.userId === selectedUserId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Bind Pusher listener when room is selected
  useEffect(() => {
    if (!selectedUserId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || "dummy_key";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true
    });

    const channel = pusher.subscribe(`chat-${selectedUserId}`);
    
    channel.bind("new-message", (newMessage: any) => {
      mutateMessages((current: any) => {
        if (!current) return [newMessage];
        if (current.some((m: any) => m.id === newMessage.id)) return current;
        return [...current, newMessage];
      }, false);
      mutateRooms(); // Refresh last message in the left sidebar list
    });

    return () => {
      pusher.unsubscribe(`chat-${selectedUserId}`);
      pusher.disconnect();
    };
  }, [selectedUserId, mutateMessages, mutateRooms]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !inputMessage.trim() || isSending) return;

    setIsSending(true);
    const content = inputMessage.trim();
    setInputMessage("");

    // Optimistic UI updates
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content,
      sender: `Support: Agent`,
      createdAt: new Date().toISOString()
    };
    mutateMessages((current: any) => [...(current || []), tempMsg], false);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, content })
      });
      if (res.ok) {
        mutateMessages();
        mutateRooms();
      }
    } catch (err) {
      console.error("Failed to transmit support message:", err);
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] border border-white/5 rounded-2xl overflow-hidden bg-[#090c16]">
      {/* ROOMS SIDEBAR */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-[#070913]/60">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            Support Queues
          </h3>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/10">
            {rooms?.length || 0} Rooms
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5 scrollbar-thin">
          {rooms && rooms.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No active customer requests.
            </div>
          ) : (
            rooms?.map((room: any) => {
              const active = room.userId === selectedUserId;
              return (
                <div
                  key={room.userId}
                  onClick={() => setSelectedUserId(room.userId)}
                  className={`p-4 cursor-pointer transition-all flex items-start gap-3 ${
                    active ? "bg-white/5" : "hover:bg-white/1"
                  }`}
                >
                  <img
                    src={room.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
                    alt={room.name}
                    className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs font-bold text-white truncate">{room.name}</p>
                      <span className="text-[8px] text-slate-500 font-mono shrink-0">
                        {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{room.lastMessage}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT SESSION */}
      <div className="flex-1 flex flex-col bg-[#070913]/30">
        {selectedUserId && selectedRoom ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-[#090c16] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img
                  src={selectedRoom.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
                  alt={selectedRoom.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{selectedRoom.name}</h4>
                  <span className="text-[9px] text-slate-500 font-mono">{selectedRoom.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] text-slate-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>ID: {selectedUserId.substring(0, 8)}...</span>
              </div>
            </div>

            {/* Message window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages?.map((msg: any) => {
                const isAgent = msg.sender.startsWith("Support:");
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        isAgent
                          ? "bg-gradient-purple-blue text-white rounded-tr-none"
                          : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-slate-500 font-mono">
                      <span>{msg.sender}</span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-white/5 bg-[#090c16] flex items-center gap-3"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Respond to ${selectedRoom.name}...`}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:border-purple-500 text-xs font-sans"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="px-4 py-3 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-purple-blue text-white hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer font-sans text-xs font-bold"
              >
                Send Reply
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
            <h4 className="text-sm font-bold text-slate-400">Select active workspace</h4>
            <p className="text-xs text-slate-550 max-w-xs mt-1 leading-relaxed">
              Click a client conversation queue from the sidebar list to open the active operations channel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
