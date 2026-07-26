"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ListingCard({ listing }) {
  const isRequest = listing.type === "buy_request";
  const [isFavorited, setIsFavorited] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    checkFavorite();
  }, []);

  async function checkFavorite() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    setUserId(userData.user.id);
    const { data } = await supabase.from("favorites").select("id").eq("user_id", userData.user.id).eq("listing_id", listing.id).maybeSingle();
    setIsFavorited(!!data);
  }

  async function toggleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) return;
    if (isFavorited) {
      await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", listing.id);
    } else {
      await supabase.from("favorites").insert({ user_id: userId, listing_id: listing.id });
    }
    setIsFavorited(!isFavorited);
  }

  return (
    <Link href={"/listings/" + listing.id} className="block bg-white border border-indigo-950/10 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative">
      <button onClick={toggleFavorite} className="absolute top-2 right-2 z-10 bg-white/90 rounded px-2 py-1 text-xs font-semibold">
        {isFavorited ? "Saved" : "Save"}
      </button>
      <div className="aspect-square bg-indigo-950/5 relative">
        {listing.images && listing.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-indigo-950/30 font-display text-sm">No photo</div>
        )}
        {isRequest && (
          <span className="absolute top-2 left-2 bg-gold-500 text-indigo-950 text-xs font-bold px-2 py-0.5 rounded">Wanted</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display font-bold text-sm truncate">{listing.title}</h3>
        <p className="text-indigo-900 font-semibold text-sm mt-1">
          {isRequest ? "Budget: NGN " + listing.price?.toLocaleString() : "NGN " + listing.price?.toLocaleString()}
        </p>
        <p className="text-xs text-indigo-950/50 mt-1">{listing.location_area}</p>
      </div>
    </Link>
  );
}