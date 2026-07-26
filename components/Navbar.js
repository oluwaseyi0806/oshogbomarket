"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const [name, setName] = useState(null);

  useEffect(() => {
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(function () { checkUser(); });
    return function () { listener.subscription.unsubscribe(); };
  }, []);

  async function checkUser() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setName(null);
      return;
    }
    const { data: profile } = await supabase.from("users").select("name").eq("id", userData.user.id).single();
    setName(profile?.name || "You");
  }

  const initial = name ? name.trim().charAt(0).toUpperCase() : "";

  return (
    <header className="sticky top-0 z-40 bg-indigo-950 text-parchment">
      <div className="h-1 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500" />
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-base sm:text-xl tracking-tight shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-512.png" alt="OshogboMarket logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0" />
          <span className="whitespace-nowrap">Oshogbo<span className="text-gold-500">Market</span></span>
        </Link>
        <nav className="flex items-center gap-3 text-sm font-body shrink-0">
          <Link href="/messages" className="hover:text-gold-400 whitespace-nowrap">
            Messages
          </Link>
          <Link href="/listings/new" className="hover:text-gold-400 whitespace-nowrap">
            <span className="hidden sm:inline">Sell / Post request</span>
            <span className="sm:hidden">+ Sell</span>
          </Link>
          {name ? (
            <Link href="/profile" className="w-8 h-8 rounded-full bg-gold-500 text-indigo-950 font-bold flex items-center justify-center shrink-0">
              {initial}
            </Link>
          ) : (
            <Link href="/auth" className="bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-1.5 whitespace-nowrap">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}