"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import ListingCard from "../../../components/ListingCard";
import { isOnline } from "../../../lib/presence";

export default function SellerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const { data } = await supabase.from("users").select("*").eq("id", id).single();
    if (data?.is_artisan) {
      router.replace("/artisans/" + id);
      return;
    }
    setSeller(data);

    const { data: listingsData } = await supabase.from("listings").select("*").eq("user_id", id).eq("status", "active").order("created_at", { ascending: false });
    setListings(listingsData || []);

    const { data: ratingsData } = await supabase.from("ratings").select("stars").eq("rated_user_id", id);
    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce(function (sum, r) { return sum + r.stars; }, 0) / ratingsData.length;
      setRating({ avg: avg, count: ratingsData.length });
    }
    setLoading(false);
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;
  if (!seller) return <p className="text-sm text-indigo-950/50">Seller not found.</p>;

  const online = isOnline(seller.last_seen);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-indigo-950/10 overflow-hidden flex items-center justify-center font-bold text-2xl text-indigo-950 shrink-0">
          {seller.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            seller.name ? seller.name.charAt(0).toUpperCase() : "?"
          )}
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-indigo-950">{seller.name}</h1>
          <p className="text-xs text-indigo-950/50">
            Member since {new Date(seller.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className={"w-2 h-2 rounded-full " + (online ? "bg-green-500" : "bg-indigo-950/20")} />
            <span className="text-xs text-indigo-950/50">{online ? "Online" : "Offline"}</span>
          </div>
          {rating && <p className="text-xs text-indigo-950/50 mt-1">{rating.avg.toFixed(1)} stars ({rating.count} reviews)</p>}
        </div>
      </div>

      <h2 className="font-display font-bold text-lg text-indigo-950 mb-3">Listings from {seller.name}</h2>
      {listings.length === 0 ? (
        <p className="text-sm text-indigo-950/50">No active listings right now.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {listings.map(function (listing) { return (<ListingCard key={listing.id} listing={listing} />); })}
        </div>
      )}
    </div>
  );
}