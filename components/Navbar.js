"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const [name, setName] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showBell, setShowBell] = useState(false);
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest("[data-bell-container]")) {
        setShowBell(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return function () { document.removeEventListener("click", handleClickOutside); };
  }, []);

  useEffect(() => {
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(function () { checkUser(); });
    return function () { listener.subscription.unsubscribe(); };
  }, []);

  async function checkUser() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setName(null);
      setAvatarUrl(null);
      return;
    }
    const { data: profile } = await supabase.from("users").select("name, avatar_url").eq("id", userData.user.id).single();
    setName(profile?.name || "You");
    setAvatarUrl(profile?.avatar_url || null);
    loadNotifications(userData.user.id);
  }

  async function loadNotifications(userId) {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(15);
    setNotifications(data || []);
  }

  async function markAllRead() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userData.user.id).eq("read", false);
    loadNotifications(userData.user.id);
  }

  const unreadCount = notifications.filter(function (n) { return !n.read; }).length;
  const initial = name ? name.trim().charAt(0).toUpperCase() : "";

  return (
    <header className="sticky top-0 z-40 bg-indigo-950 text-parchment">
      <div className="h-1 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500" />
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-base sm:text-xl tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-512.png" alt="OshogboMarket logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
          <span className="whitespace-nowrap">Oshogbo<span className="text-gold-500">Market</span></span>
        </Link>
        <div className="flex items-center gap-3">
         {name && (
            <div className="relative" data-bell-container>
              <button onClick={() => { setShowBell(!showBell); if (!showBell) markAllRead(); }} className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                  <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 17a3 3 0 0 0 6 0" strokeLinecap="round" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-500 text-indigo-950 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showBell && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-indigo-950 rounded-lg shadow-lg border border-indigo-950/10 max-h-80 overflow-y-auto z-50">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-indigo-950/50">No notifications yet.</p>
                  ) : (
                    notifications.map(function (n) {
                      return (
                        <Link key={n.id} href={n.link || "/"} onClick={() => setShowBell(false)} className="block p-3 text-sm border-b border-indigo-950/5 hover:bg-indigo-950/5">
                          {n.message}
                        </Link>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
          {name ? (
            <Link href="/profile" className="w-8 h-8 rounded-full bg-gold-500 text-indigo-950 font-bold flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </Link>
          ) : (
            <Link href="/auth" className="bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-1.5 whitespace-nowrap">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}