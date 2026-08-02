"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { ensureReferralCode } from "../../lib/referrals";

export default function ReferralsPage() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState("");
  const [totalReferred, setTotalReferred] = useState(0);
  const [artisanReferred, setArtisanReferred] = useState(0);
  const [boostsEarned, setBoostsEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push("/auth");
      return;
    }
    const userId = userData.user.id;

    const code = await ensureReferralCode(userId);
    setReferralCode(code || "");

    const { count: total } = await supabase.from("users").select("id", { count: "exact", head: true }).eq("referred_by", userId);
    setTotalReferred(total || 0);

    const { count: artisans } = await supabase.from("users").select("id", { count: "exact", head: true }).eq("referred_by", userId).eq("is_artisan", true);
    setArtisanReferred(artisans || 0);

    const { data: profile } = await supabase.from("users").select("referral_boosts_granted").eq("id", userId).single();
    setBoostsEarned(profile?.referral_boosts_granted || 0);

    setLoading(false);
  }

  function copyLink() {
    const link = window.location.origin + "/auth?ref=" + referralCode;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(function () { setCopied(false); }, 2000);
  }

  function shareOnWhatsApp() {
    const link = window.location.origin + "/auth?ref=" + referralCode;
    const text = "Join OshogboMarket - buy, sell, or find trusted artisans in Osogbo. Sign up here: " + link;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  const progressInCurrentCycle = artisanReferred % 3;
  const remaining = 3 - progressInCurrentCycle;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-1">Invite and earn</h1>
      <p className="text-sm text-indigo-950/60 mb-4">
        Invite 3 artisans who register their skill, and one of your listings gets boosted to the top for 7 days - automatically.
      </p>

      <div className="bg-indigo-950 rounded-lg p-4 text-parchment mb-4">
        <p className="text-xs uppercase tracking-wide text-gold-500 font-bold mb-2">Your referral link</p>
        <p className="text-sm break-all mb-3">{typeof window !== "undefined" ? window.location.origin : ""}/auth?ref={referralCode}</p>
        <div className="flex gap-2">
          <button onClick={copyLink} className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-sm">
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button onClick={shareOnWhatsApp} className="flex-1 bg-green-600 rounded px-3 py-2 text-sm">
            Share on WhatsApp
          </button>
        </div>
      </div>

      <div className="bg-white border border-indigo-950/10 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-indigo-950/70">Total people referred</span>
          <span className="font-bold text-indigo-950">{totalReferred}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-indigo-950/70">Registered as artisans</span>
          <span className="font-bold text-indigo-950">{artisanReferred}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-950/70">Free boosts earned so far</span>
          <span className="font-bold text-gold-500">{boostsEarned}</span>
        </div>
      </div>

      <div className="bg-white border border-indigo-950/10 rounded-lg p-4">
        <p className="text-sm text-indigo-950/70 mb-2">
          {remaining === 3 ? "Refer 3 artisans to earn your next free boost." : remaining + " more artisan referral" + (remaining === 1 ? "" : "s") + " until your next free boost."}
        </p>
        <div className="w-full bg-indigo-950/10 rounded-full h-2">
          <div className="bg-gold-500 h-2 rounded-full" style={{ width: (progressInCurrentCycle / 3) * 100 + "%" }} />
        </div>
      </div>
    </div>
  );
}