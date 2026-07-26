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
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-512.png" alt="OshogboMarket logo" className="w-8 h-8 rounded-lg" />
          Oshogbo<span className="text-gold-500">Market</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-body">
          <Link href="/listings/new" className="hover:text-gold-400">Sell / Post request</Link>
          {name ? (
            <Link href="/profile" className="w-8 h-8 rounded-full bg-gold-500 text-indigo-950 font-bold flex items-center justify-center">
              {initial}
            </Link>
          ) : (
            <Link href="/auth" className="bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-1.5">
              Sign In / Register
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}