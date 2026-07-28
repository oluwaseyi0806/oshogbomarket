"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import ListingCard from "../../components/ListingCard";
import { ARTISAN_SKILLS } from "../../lib/osogboAreas";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState(null);const [isArtisan, setIsArtisan] = useState(false);
  const [artisanSkill, setArtisanSkill] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [artisanRating, setArtisanRating] = useState(null);

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
    setIsArtisan(!!profileData?.is_artisan);
    setArtisanSkill(profileData?.artisan_skill || "");
    setYearsExperience(profileData?.years_experience || "");

    const { data: ratingsData } = await supabase.from("ratings").select("stars").eq("rated_user_id", userData.user.id);
    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce(function (sum, r) { return sum + r.stars; }, 0) / ratingsData.length;
      setArtisanRating({ avg: avg, count: ratingsData.length });
    }

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

  async function saveArtisanProfile() {
    await supabase.from("users").update({
      is_artisan: isArtisan,
      artisan_skill: artisanSkill,
      years_experience: yearsExperience ? Number(yearsExperience) : null,
      service_area: "Osogbo",
    }).eq("id", userId);
    alert("Artisan profile saved.");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <p className="text-sm text-indigo-950/50">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="bg-white border border-indigo-950/10 rounded-lg p-4 mb-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-indigo-950 mb-3">
          <input type="checkbox" checked={isArtisan} onChange={(e) => setIsArtisan(e.target.checked)} />
          I offer a skilled service (plumbing, electrical, etc.)
        </label>
        {isArtisan && (
          <div className="space-y-2">
            <select value={artisanSkill} onChange={(e) => setArtisanSkill(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm">
              <option value="">Select your main skill</option>
              {ARTISAN_SKILLS.map(function (s) { return (<option key={s} value={s}>{s}</option>); })}
            </select>
            <input type="number" placeholder="Years of experience" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} className="w-full border border-indigo-950/20 rounded px-3 py-2 text-sm" />
            {artisanRating && (
              <p className="text-xs text-indigo-950/60">{artisanRating.avg.toFixed(1)} out of 5 stars ({artisanRating.count} rating{artisanRating.count === 1 ? "" : "s"})</p>
            )}
            <button onClick={saveArtisanProfile} className="bg-gold-500 text-indigo-950 font-semibold rounded px-3 py-2 text-sm">Save artisan profile</button>
          </div>
        )}
      </div>
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