"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ListingCard from "../../components/ListingCard";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
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

    const { data: profileData } = await supabase.from("users").select("*").eq("id", userData.user.id).single();
    setProfile(profileData);

    const { data: listingsData } = await supabase.from("listings").select("*").eq("user_id", userData.user.id).order("created_at", { ascending: false });
    setMyListings(listingsData || []);

    const { data: favData } = await supabase.from("favorites").select("listings(*)").eq("user_id", userData.user.id);
    setFavorites((favData || []).map((f) => f.listings).filter(Boolean));

    setLoading(false);
  }

  async function markSold(id) {
    await supabase.from("listings").update({ status: "sold", updated_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  async function deleteListing(id) {
    await supabase.from("listings").delete().eq("id", id);
    load();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-indigo-950">{profile?.name}</h1>
          <p className="text-sm text-indigo-950/50">
            Member since {new Date(profile?.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
          </p>
        </div>
        <button onClick={logout} className="text-sm text-indigo-950/60 underline">Log out</button>
      </div>

      <h2 className="font-display font-bold text-indigo-950 mb-2">My listings</h2>
      {myListings.length === 0 ? (
        <p className="text-sm text-indigo-950/50">You have not posted anything yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {myListings.map((listing) => (
            <div key={listing.id}>
              <ListingCard listing={listing} />
              <div className="flex gap-2 mt-1 text-xs">
                {listing.status === "active" && (
                  <button onClick={() => markSold(listing.id)} className="underline text-indigo-950/70">Mark sold</button>
                )}
                <button onClick={() => deleteListing(listing.id)} className="underline text-red-600/80">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display font-bold text-indigo-950 mb-2 mt-8">My favorites</h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-indigo-950/50">Nothing saved yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {favorites.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}