"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ListingCard from "../../components/ListingCard";

export default function SavedPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
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
    const { data: favData } = await supabase.from("favorites").select("listings(*)").eq("user_id", userData.user.id);
    setFavorites((favData || []).map(function (f) { return f.listings; }).filter(Boolean));
    setLoading(false);
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-xl text-indigo-950 mb-4">Saved goods</h1>
      {favorites.length === 0 ? (
        <p className="text-sm text-indigo-950/50">Nothing saved yet. Tap "Save" on any listing to keep it here.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {favorites.map(function (listing) {
            return <ListingCard key={listing.id} listing={listing} />;
          })}
        </div>
      )}
    </div>
  );
}