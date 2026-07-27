"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function BottomNav() {
  const pathname = usePathname();
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    checkUnread();
  }, [pathname]);

  async function checkUnread() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setMessageCount(0);
      return;
    }
    const userId = userData.user.id;
    const { data: chats } = await supabase.from("chats").select("id").or("buyer_id.eq." + userId + ",seller_id.eq." + userId);
    const chatIds = (chats || []).map(function (c) { return c.id; });
    if (chatIds.length === 0) {
      setMessageCount(0);
      return;
    }
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("chat_id", chatIds)
      .eq("read", false)
      .neq("sender_id", userId);
    setMessageCount(count || 0);
  }

  const items = [
    {
      href: "/",
      label: "Home",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/saved",
      label: "Saved",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M12 21s-7-4.5-9.5-9C1 8.5 3 5 6.5 5c2 0 3.3 1 5.5 3 2.2-2 3.5-3 5.5-3C21 5 23 8.5 21.5 12 19 16.5 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/listings/new",
      label: "Sell",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: "/messages",
      label: "Messages",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1 4.2A7.96 7.96 0 0 1 21 12z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/profile",
      label: "Profile",
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-indigo-950 text-parchment border-t border-white/10">
      <div className="max-w-5xl mx-auto grid grid-cols-5">
        {items.map(function (item) {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={"flex flex-col items-center justify-center py-2 relative " + (active ? "text-gold-500" : "text-parchment/70")}>
              {item.icon(active)}
              <span className="text-[10px] mt-0.5">{item.label}</span>
              {item.label === "Messages" && messageCount > 0 && (
                <span className="absolute top-1 right-1/3 bg-gold-500 text-indigo-950 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {messageCount > 9 ? "9+" : messageCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}