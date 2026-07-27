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
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      router.push("/auth");
      return;
    }
    setUserId(userData.user.id);

    const { data: profileData } = await supabase.from("users").select("*").eq("id", userData.user.id).single();
    setProfile(profileData);

    const { data: listingsData } = await supabase.from("listings").select("*").eq("user_id", userData.user.id).order("created_at", { ascending: false });
    setMyListings(listingsData || []);

    const { data: favData } = await supabase.from("favorites").select("listings(*)").eq("user_id", userData.user.id);
    setFavorites((favData || []).map(function (f) { return f.listings; }).filter(Boolean));

    setLoading(false);
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file || !userId) return;
    setUploading(true);

    const filePath = userId + "/avatar-" + Date.now() + "-" + file.name;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("users").update({ avatar_url: publicUrlData.publicUrl }).eq("id", userId);
      setProfile(function (prev) { return Object.assign({}, prev, { avatar_url: publicUrlData.publicUrl }); });
    }
    setUploading(false);
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
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full bg-indigo-950/10 overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display font-bold text-2xl text-indigo-950">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-gold-500 text-indigo-950 text-[10px] font-bold rounded-full w-6 h-6 flex items-center justify-center cursor-pointer">
              {uploading ? "..." : "+"}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-indigo-950">{profile?.name}</h1>
            <p className="text-sm text-indigo-950/50">{profile?.email}</p>
            <p className="text-xs text-indigo-950/40">
              Member since {new Date(profile?.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-indigo-950/60 underline shrink-0">Log out</button>
      </div>

      <h2 className="font-display font-bold text-indigo-950 mb-2">My listings</h2>
      {myListings.length === 0 ? (
        <p className="text-sm text-indigo-950/50">You have not posted anything yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {myListings.map(function (listing) {
            return (
              <div key={listing.id}>
                <ListingCard listing={listing} />
                <div className="flex gap-2 mt-1 text-xs">
                  {listing.status === "active" && (
                    <button onClick={() => markSold(listing.id)} className="underline text-indigo-950/70">Mark sold</button>
                  )}
                  <button onClick={() => deleteListing(listing.id)} className="underline text-red-600/80">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="font-display font-bold text-indigo-950 mb-2 mt-8">My favorites</h2>
      {favorites.length === 0 ? (
        <p className="text-sm text-indigo-950/50">Nothing saved yet.</p>
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