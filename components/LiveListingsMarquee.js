"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";
import AutoScrollRow from "./AutoScrollRow";

export default function LiveListingsMarquee() {
  const [listings, setListings] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("listings")
      .select("id, title, price, images")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(15);

    if (error) {
      console.error("LiveListingsMarquee fetch error:", error);
    }
    setListings(data || []);
    setLoaded(true);
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <p className="text-xs font-bold uppercase tracking-wide text-indigo-950/60">Recent Posts</p>
      </div>

      {!loaded ? (
        <p className="text-xs text-indigo-950/40">Loading...</p>
      ) : listings.length === 0 ? (
        <p className="text-xs text-indigo-950/40">No recent posts to show yet.</p>
      ) : (
        <AutoScrollRow speed={0.5}>
          {listings.concat(listings).map(function (listing, i) {
            return (
              <Link key={listing.id + "-" + i} href={"/listings/" + listing.id} className="flex-shrink-0 w-28 bg-white border border-indigo-950/10 rounded-lg overflow-hidden">
                <div className="w-28 h-28 bg-indigo-950/5">
                  {listing.images && listing.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="p-1.5">
                  <p className="text-[11px] font-semibold text-indigo-950 truncate">{listing.title}</p>
                  <p className="text-[11px] text-indigo-900">NGN {listing.price?.toLocaleString()}</p>
                </div>
              </Link>
            );
          })}
        </AutoScrollRow>
      )}
    </div>
  );
}