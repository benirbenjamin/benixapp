"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, ExternalLink, BellRing, BellOff } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import {
  isPushSupported,
  requestPushPermission,
  getPushPermissionStatus,
  sendBrowserPushNotification,
} from "@/lib/pushNotifications";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSupported(isPushSupported());
      setPushStatus(getPushPermissionStatus());
    }

    fetchNotifications();

    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const playNotificationChime = () => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: E5 (659 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: B5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.1);
      gain2.gain.setValueAtTime(0.18, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } catch {
      // Audio playback restrictions on un-interacted documents
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter((n: any) => !n.isRead).length;
        
        // If new unread notification arrived, play in-app sound and dispatch desktop push!
        if (unread > unreadCount && unreadCount > 0 && data.notifications[0]) {
          playNotificationChime();

          const latest = data.notifications[0];
          sendBrowserPushNotification(latest.title, {
            body: latest.message,
            onClick: () => {
              if (latest.link) window.location.href = latest.link;
            },
          });
        }
        
        setUnreadCount(unread);
      }
    } catch {
      // Silently fail if not logged in
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "POST" });
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnablePush = async () => {
    const res = await requestPushPermission();
    setPushStatus(res);
    if (res === "granted") {
      sendBrowserPushNotification("Push Notifications Active 🎉", {
        body: "You will now receive instant desktop & tray alerts for critical operations, withdrawals, and updates.",
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            handleMarkAllAsRead();
          }
        }}
        className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
        title="Notifications & System Alerts"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl py-3 z-50 divide-y divide-slate-100 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-4 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-brand hover:underline font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Desktop Push Banner */}
          {supported && pushStatus !== "granted" && (
            <div className="px-4 py-2 bg-blue-50/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-blue-900 font-medium">
                <BellRing className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Enable desktop push alerts</span>
              </div>
              <button
                onClick={handleEnablePush}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold transition-colors"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link || "#"}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 hover:bg-slate-50 transition-colors ${
                    !item.isRead ? "bg-slate-50/70" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-xs text-slate-900">{item.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pt-2 text-center">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
            >
              View Dashboard &bull; Activity History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
